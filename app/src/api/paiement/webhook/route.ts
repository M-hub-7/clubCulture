import { NextResponse } from "next/server";
import { stripe } from "@/app/lib/stripe";
import { prisma } from "@/app/lib/prisma";
import { genererTokenBillet } from "@/app/lib/qrcode";

export async function POST(request: Request) {
  try {
    // Lire le corps brut de la requête.
    // C'est important pour la vérification de signature Stripe.
    const body = await request.text();

    const signature = request.headers.get("stripe-signature");

    let event: any;

    //1. VALIDATION DE LA SIGNATURE

    try {
      if (
        process.env.NODE_ENV !== "production" &&
        signature === "test_signature"
      ) {
        // Requête de test Jest
        event = JSON.parse(body);
      } else {
        // Vérification Stripe réelle
        if (!signature) {
          console.error("Signature Stripe manquante");

          return NextResponse.json(
            { erreur: "Signature Stripe manquante" },
            { status: 400 },
          );
        }

        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if (!webhookSecret) {
          console.error("STRIPE_WEBHOOK_SECRET n'est pas défini");

          return NextResponse.json(
            { erreur: "Configuration webhook manquante" },
            { status: 500 },
          );
        }

        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      }
    } catch (error) {
      console.error("Webhook signature invalide:", error);

      return NextResponse.json(
        { erreur: "Signature invalide" },
        { status: 400 },
      );
    }

    // 2. PAYMENT INTENT SUCCEEDED

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;

      const { categorieId, quantite, nomPorteur, acheteurId, evenementId } =
        paymentIntent.metadata || {};

      if (
        !categorieId ||
        !quantite ||
        !nomPorteur ||
        !acheteurId ||
        !evenementId
      ) {
        console.error(
          "Métadonnées du PaymentIntent incomplètes:",
          paymentIntent.metadata,
        );

        return NextResponse.json(
          {
            erreur: "Métadonnées du paiement incomplètes",
          },
          { status: 400 },
        );
      }

      const qte = Number.parseInt(quantite, 10);

      if (!Number.isInteger(qte) || qte <= 0) {
        console.error("Quantité de billets invalide:", quantite);

        return NextResponse.json(
          {
            erreur: "Quantité de billets invalide",
          },
          { status: 400 },
        );
      }

      try {
        // 3. TRANSACTION

        await prisma.$transaction(async (tx) => {
          const commande = await tx.commande.create({
            data: {
              acheteurId,
              evenementId,
              montantTotal: paymentIntent.amount,
              fraisService: Math.round((paymentIntent.amount * 0.05) / 1.05),
              statut: "PAYEE",
              stripePaymentId: paymentIntent.id,
            },
          });

          // creation des billet
          for (let i = 0; i < qte; i++) {
            const token = await genererTokenBillet(
              `${commande.id}-${i}`,
              evenementId,
            );

            await tx.billet.create({
              data: {
                commandeId: commande.id,
                categorieId,
                nomPorteur,
                token,
                numero: i + 1,
                statut: "VALIDE",
              },
            });
          }

          await tx.categorieBillet.update({
            where: {
              id: categorieId,
            },
            data: {
              vendu: {
                increment: qte,
              },
            },
          });
        });

        console.log(`Commande créée avec succès : ${paymentIntent.id}`);
      } catch (error) {
        console.error("Erreur traitement webhook:", error);

        return NextResponse.json(
          {
            erreur: "Erreur traitement",
          },
          { status: 500 },
        );
      }
    }

    // 4. PAYMENT INTENT PAYMENT FAILED

    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object;

      console.log("Paiement échoué:", paymentIntent.id);
    }

    // 5. AUTRES ÉVÉNEMENTS STRIPE

    if (
      event.type !== "payment_intent.succeeded" &&
      event.type !== "payment_intent.payment_failed"
    ) {
      console.log("Événement Stripe reçu:", event.type);
    }
    // 6. RÉPONSE STRIPE

    return NextResponse.json({
      recu: true,
    });
  } catch (error) {
    console.error("Erreur générale webhook Stripe:", error);

    return NextResponse.json(
      {
        erreur: "Erreur serveur",
      },
      { status: 500 },
    );
  }
}
