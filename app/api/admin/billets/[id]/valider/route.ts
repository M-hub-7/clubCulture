import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { verifierRole } from "@/app/lib/verifierRole";
import { signJwt } from "@/app/lib/qrcode";

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const admin = await verifierRole("ADMIN");

    if (!admin) {
      return NextResponse.json(
        { erreur: "Accès administrateur requis." },
        { status: 401 },
      );
    }

    const { id } = params;

    const billet = await prisma.billet.findUnique({
      where: { id },
      include: {
        categorie: {
          include: { evenement: true },
        },
        commande: true,
      },
    });

    if (!billet) {
      return NextResponse.json(
        { erreur: "Billet introuvable." },
        { status: 404 },
      );
    }

    if (billet.statut !== "EN_ATTENTE_VALIDATION") {
      return NextResponse.json(
        { erreur: "Ce billet n'est plus en attente de validation." },
        { status: 409 },
      );
    }

    if (
      billet.commande.statut !== "EN_ATTENTE_VALIDATION" ||
      !billet.commande.stripePaymentId
    ) {
      return NextResponse.json(
        { erreur: "La commande n'est pas éligible à la validation." },
        { status: 409 },
      );
    }

    const jetonSignature = await signJwt({
      billetId: billet.id,
      evenementId: billet.categorie.evenementId,
    });

    const resultat = await prisma.$transaction(async (tx) => {
      const maj = await tx.billet.updateMany({
        where: {
          id: billet.id,
          statut: "EN_ATTENTE_VALIDATION",
        },
        data: {
          statut: "VALIDE",
          token: jetonSignature,
        },
      });

      if (maj.count !== 1) {
        throw new Error("BILLET_DEJA_TRAITE");
      }

      const billetsRestants = await tx.billet.count({
        where: {
          commandeId: billet.commandeId,
          statut: "EN_ATTENTE_VALIDATION",
        },
      });

      if (billetsRestants === 0) {
        await tx.commande.updateMany({
          where: {
            id: billet.commandeId,
            statut: "EN_ATTENTE_VALIDATION",
          },
          data: { statut: "PAYEE" },
        });
      }

      return tx.billet.findUnique({
        where: { id: billet.id },
      });
    });

    return NextResponse.json({
      succes: true,
      message: "Billet validé. Son QR code est désormais disponible.",
      billet: resultat,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "BILLET_DEJA_TRAITE") {
      return NextResponse.json(
        { erreur: "Ce billet a déjà été traité." },
        { status: 409 },
      );
    }

    console.error("Erreur validation du billet :", error);

    return NextResponse.json(
      { erreur: "Erreur serveur lors de la validation." },
      { status: 500 },
    );
  }
}
