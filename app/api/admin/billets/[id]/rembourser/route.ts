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

    if (billet.statut === "REMBOURSE") {
      return NextResponse.json(
        { erreur: "Ce billet est déjà remboursé" },
        { status: 400 },
      );
    }

    if (billet.statut === "UTILISE") {
      return NextResponse.json(
        { erreur: "Impossible de rembourser un billet déjà utilisé" },
        { status: 400 },
      );
    }

    // Calculer le montant à rembourser (prix du billet sans les frais)
    const montantRemboursement = billet.categorie.prix * 100;

    // Effectuer le remboursement via Stripe
    if (billet.commande.stripePaymentId) {
      await stripe.refunds.create({
        payment_intent: billet.commande.stripePaymentId,
        amount: montantRemboursement,
        reason: "requested_by_customer",
      });
    }

    // Mettre à jour le statut du billet
    await prisma.billet.update({
      where: { id },
      data: { statut: "REMBOURSE" },
    });

    // Décrémenter les places vendues
    await prisma.categorieBillet.update({
      where: { id: billet.categorieId },
      data: { vendu: { decrement: 1 } },
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
