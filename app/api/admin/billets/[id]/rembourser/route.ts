import { NextResponse } from "next/server";
import { verifierRoleUser } from "@/app/lib/getUser";
import { prisma } from "@/app/lib/prisma";
import { stripe } from "@/app/lib/stripe";

// POST — Rembourser un billet
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await verifierRoleUser(request, "ADMIN");
    if (!session) {
      return NextResponse.json(
        { erreur: "Accès refusé — Admin uniquement" },
        { status: 403 },
      );
    }

    const { id } = await params;
    const { raison } = await request.json();

    const billet = await prisma.billet.findUnique({
      where: { id },
      include: {
        commande: true,
        categorie: true,
      },
    });

    if (!billet) {
      return NextResponse.json(
        { erreur: "Billet introuvable" },
        { status: 404 },
      );
    }

    if (billet.statut !== "VALIDE") {
      return NextResponse.json(
        {
          erreur:
            billet.statut === "EN_ATTENTE_VALIDATION"
              ? "Billet non validé : utilisez « Refuser »"
              : `Impossible de rembourser un billet ${billet.statut.toLowerCase()}`,
        },
        { status: 400 },
      );
    }

    if (!billet.commande.stripePaymentId) {
      return NextResponse.json(
        { erreur: "Aucun paiement Stripe associé à cette commande" },
        { status: 400 },
      );
    }

    // Montant à rembourser : prix du billet (euros → centimes), sans les frais
    const montantRemboursement = billet.categorie.prix * 100;

    // Réservation atomique VALIDE → REMBOURSE : un double clic ne rembourse qu'une fois
    const reserve = await prisma.billet.updateMany({
      where: { id, statut: "VALIDE" },
      data: { statut: "REMBOURSE" },
    });

    if (reserve.count !== 1) {
      return NextResponse.json(
        { erreur: "Ce billet vient d'être traité" },
        { status: 409 },
      );
    }

    try {
      await stripe.refunds.create(
        {
          payment_intent: billet.commande.stripePaymentId,
          amount: montantRemboursement,
          reason: "requested_by_customer",
          metadata: { billetId: id },
        },
        { idempotencyKey: `remboursement-billet-${id}` },
      );
    } catch (error) {
      // Échec Stripe : le billet redevient valide
      await prisma.billet.update({
        where: { id },
        data: { statut: "VALIDE" },
      });
      throw error;
    }

    await prisma.$transaction(async (tx) => {
      await tx.categorieBillet.updateMany({
        where: { id: billet.categorieId, vendu: { gt: 0 } },
        data: { vendu: { decrement: 1 } },
      });

      // Commande entièrement remboursée si plus aucun billet actif
      const actifs = await tx.billet.count({
        where: {
          commandeId: billet.commandeId,
          statut: { in: ["VALIDE", "UTILISE", "EN_ATTENTE_VALIDATION"] },
        },
      });
      if (actifs === 0) {
        await tx.commande.update({
          where: { id: billet.commandeId },
          data: { statut: "REMBOURSEE" },
        });
      }
    });

    return NextResponse.json({
      message: "Billet remboursé avec succès",
      montantRembourse: montantRemboursement,
      montantFormate: `${(montantRemboursement / 100).toFixed(2)} €`,
      raison: raison || "Remboursement administratif",
    });
  } catch (error) {
    console.error("Erreur remboursement:", error);
    return NextResponse.json({ erreur: "Erreur serveur" }, { status: 500 });
  }
}
