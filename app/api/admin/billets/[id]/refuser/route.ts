import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { stripe } from "@/app/lib/stripe";
import { verifierRole } from "@/app/lib/verifierRole";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await verifierRole("ADMIN");

    if (!admin) {
      return NextResponse.json(
        { erreur: "Accès administrateur requis." },
        { status: 401 },
      );
    }

    const { id } = await params;

    const billet = await prisma.billet.findUnique({
      where: { id },
      include: {
        commande: {
          include: { billets: true },
        },
      },
    });

    if (!billet) {
      return NextResponse.json(
        { erreur: "Billet introuvable." },
        { status: 404 },
      );
    }

    const commande = billet.commande;

    if (
      billet.statut !== "EN_ATTENTE_VALIDATION" ||
      commande.statut !== "EN_ATTENTE_VALIDATION"
    ) {
      return NextResponse.json(
        { erreur: "Ce billet ou cette commande n'est plus en attente." },
        { status: 409 },
      );
    }

    if (commande.billets.some((b) => b.statut !== "EN_ATTENTE_VALIDATION")) {
      return NextResponse.json(
        {
          erreur:
            "Un remboursement intégral est impossible : certains billets ont déjà été traités.",
        },
        { status: 409 },
      );
    }

    if (!commande.stripePaymentId) {
      return NextResponse.json(
        { erreur: "Aucun paiement Stripe associé à cette commande." },
        { status: 409 },
      );
    }

    // Le remboursement doit réussir avant de marquer la commande remboursée.
    // La même clé permet de réutiliser le résultat Stripe lors d'un retry.
    await stripe.refunds.create(
      {
        payment_intent: commande.stripePaymentId,
      },
      {
        idempotencyKey: `club-culture-refus-${commande.id}`,
      },
    );

    await prisma.$transaction(async (tx) => {
      const commandeCourante = await tx.commande.findUnique({
        where: { id: commande.id },
        include: { billets: true },
      });

      if (
        !commandeCourante ||
        commandeCourante.statut !== "EN_ATTENTE_VALIDATION" ||
        commandeCourante.billets.some(
          (b) => b.statut !== "EN_ATTENTE_VALIDATION",
        )
      ) {
        throw new Error("COMMANDE_DEJA_TRAITEE");
      }

      await tx.billet.updateMany({
        where: {
          commandeId: commande.id,
          statut: "EN_ATTENTE_VALIDATION",
        },
        data: { statut: "REFUSE" },
      });

      await tx.commande.update({
        where: { id: commande.id },
        data: { statut: "REMBOURSEE" },
      });

      const reservation = await tx.reservation.findUnique({
        where: { id: commande.reservationId ?? "" },
      });

      if (reservation) {
        await tx.reservation.update({
          where: { id: reservation.id },
          data: { statut: "REMBOURSEE" },
        });
      }

      const quantite = commandeCourante.billets.length;

      await tx.categorieBillet.updateMany({
        where: {
          id: billet.categorieId,
          vendu: { gte: quantite },
        },
        data: {
          vendu: { decrement: quantite },
        },
      });
    });

    return NextResponse.json({
      succes: true,
      message: "Commande refusée et remboursement intégral effectué.",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "COMMANDE_DEJA_TRAITEE") {
      return NextResponse.json(
        {
          erreur:
            "La commande a changé pendant le traitement. Vérifiez son état avant de réessayer.",
        },
        { status: 409 },
      );
    }

    console.error("Erreur lors du refus du billet :", error);

    return NextResponse.json(
      {
        erreur:
          "Le refus ou le remboursement n'a pas pu être finalisé. Vérifiez le statut Stripe avant toute nouvelle action.",
      },
      { status: 500 },
    );
  }
}
