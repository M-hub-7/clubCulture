import { NextResponse } from "next/server";
import Stripe from "stripe";
import { randomUUID } from "crypto";
import { prisma } from "@/app/lib/prisma";
import { stripe } from "@/app/lib/stripe";

const FRAIS_SERVICE_RATE = 0.05;

async function rembourserEtConfirmer(
  paymentIntentId: string,
  montant?: number,
) {
  await stripe.refunds.create(
    {
      payment_intent: paymentIntentId,
      ...(montant !== undefined ? { amount: montant } : {}),
    },
    {
      idempotencyKey: `club-culture-refund-${paymentIntentId}`,
    },
  );
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return NextResponse.json(
      { erreur: "Signature Stripe ou secret webhook manquant." },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    const payload = await request.text();

    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    console.error("Signature webhook Stripe invalide :", error);

    return NextResponse.json(
      { erreur: "Signature Stripe invalide." },
      { status: 400 },
    );
  }

  if (event.type !== "payment_intent.succeeded") {
    return NextResponse.json({ reçu: true });
  }

  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const reservationId = paymentIntent.metadata.reservationId;

  try {
    if (!reservationId) {
      await rembourserEtConfirmer(paymentIntent.id);
      return NextResponse.json({ reçu: true, remboursement: true });
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { categorie: true },
    });

    if (!reservation) {
      await rembourserEtConfirmer(paymentIntent.id);
      return NextResponse.json({ reçu: true, remboursement: true });
    }

    // Vérifier que le paiement correspond à la réservation.
    const montantBillets =
      reservation.categorie.prix * reservation.quantite * 100;

    const fraisService = Math.round(montantBillets * FRAIS_SERVICE_RATE);

    const montantAttendu = montantBillets + fraisService;

    if (
      paymentIntent.currency !== "eur" ||
      paymentIntent.amount !== montantAttendu ||
      paymentIntent.metadata.acheteurId !== reservation.acheteurId ||
      paymentIntent.metadata.categorieId !== reservation.categorieId ||
      paymentIntent.metadata.evenementId !== reservation.evenementId ||
      paymentIntent.metadata.quantite !== String(reservation.quantite) ||
      reservation.paymentIntentId !== paymentIntent.id
    ) {
      await rembourserEtConfirmer(paymentIntent.id);

      return NextResponse.json({
        reçu: true,
        remboursement: true,
      });
    }

    // Une notification Stripe peut être envoyée plusieurs fois.
    const commandeExistante = await prisma.commande.findFirst({
      where: {
        OR: [
          { stripePaymentId: paymentIntent.id },
          { reservationId: reservation.id },
        ],
      },
    });

    if (commandeExistante) {
      return NextResponse.json({
        reçu: true,
        déjàTraité: true,
      });
    }

    // Un paiement peut réussir après l'expiration de la réservation.
    if (reservation.statut !== "ACTIVE" || reservation.expireAt <= new Date()) {
      if (reservation.statut === "ACTIVE") {
        await prisma.$transaction(async (tx) => {
          const annulation = await tx.reservation.updateMany({
            where: {
              id: reservation.id,
              statut: "ACTIVE",
            },
            data: { statut: "ANNULEE" },
          });

          if (annulation.count === 1) {
            await tx.categorieBillet.updateMany({
              where: {
                id: reservation.categorieId,
                reserve: { gte: reservation.quantite },
              },
              data: {
                reserve: { decrement: reservation.quantite },
              },
            });
          }
        });
      }

      await rembourserEtConfirmer(paymentIntent.id);

      return NextResponse.json({
        reçu: true,
        remboursement: true,
      });
    }

    await prisma.$transaction(
      async (tx) => {
        // Recontrôler la réservation dans la transaction.
        const reservationCourante = await tx.reservation.findUnique({
          where: { id: reservation.id },
          include: { categorie: true },
        });

        if (
          !reservationCourante ||
          reservationCourante.statut !== "ACTIVE" ||
          reservationCourante.expireAt <= new Date()
        ) {
          throw new Error("RESERVATION_EXPIREE");
        }

        const commandeExistanteDansTransaction = await tx.commande.findFirst({
          where: {
            OR: [
              { stripePaymentId: paymentIntent.id },
              { reservationId: reservation.id },
            ],
          },
        });

        if (commandeExistanteDansTransaction) {
          return;
        }

        const stockMisAJour = await tx.categorieBillet.updateMany({
          where: {
            id: reservation.categorieId,
            reserve: { gte: reservation.quantite },
            quantite: {
              gte: reservation.categorie.vendu + reservation.quantite,
            },
          },
          data: {
            reserve: { decrement: reservation.quantite },
            vendu: { increment: reservation.quantite },
          },
        });

        if (stockMisAJour.count !== 1) {
          throw new Error("STOCK_INDISPONIBLE");
        }

        const commande = await tx.commande.create({
          data: {
            acheteurId: reservation.acheteurId,
            evenementId: reservation.evenementId,
            montantTotal: paymentIntent.amount,
            fraisService,
            statut: "EN_ATTENTE_VALIDATION",
            stripePaymentId: paymentIntent.id,
            reservationId: reservation.id,
          },
        });

        // Le token temporaire n'est pas un QR code utilisable.
        // Il sera remplacé par le jeton signé lors de l'approbation.
        await tx.billet.createMany({
          data: Array.from({ length: reservation.quantite }, (_, index) => ({
            commandeId: commande.id,
            categorieId: reservation.categorieId,
            nomPorteur: reservation.nomPorteur,
            numero: index + 1,
            statut: "EN_ATTENTE_VALIDATION" as const,
            token: `PENDING-${randomUUID()}`,
          })),
        });

        await tx.reservation.update({
          where: { id: reservation.id },
          data: { statut: "PAYEE" },
        });
      },
      { isolationLevel: "Serializable" },
    );

    return NextResponse.json({
      reçu: true,
      message: "Paiement traité. Billets en attente de validation.",
    });
  } catch (error) {
    // Stripe réessaiera si le traitement doit être rejoué.
    console.error("Erreur de traitement webhook Stripe :", error);

    return NextResponse.json(
      { erreur: "Traitement du paiement impossible." },
      { status: 500 },
    );
  }
}
