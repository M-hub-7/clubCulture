import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { verifierRole } from "@/app/lib/verifierRole";

// PUT — Admin valide ou rejette un événement
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await verifierRole("ADMIN");

    if (!session) {
      return NextResponse.json(
        { erreur: "Accès refusé — Admin uniquement" },
        { status: 403 },
      );
    }

    const { id } = await params;

    const { decision, raison } = await request.json();

    if (!["PUBLIE", "BROUILLON"].includes(decision)) {
      return NextResponse.json(
        { erreur: "Decision invalide — PUBLIE ou BROUILLON" },
        { status: 400 },
      );
    }

    const evenement = await prisma.evenement.findUnique({
      where: { id },
    });

    if (!evenement) {
      return NextResponse.json(
        { erreur: "Événement introuvable" },
        { status: 404 },
      );
    }

    if (evenement.statut !== "EN_MODERATION") {
      return NextResponse.json(
        {
          erreur: "Cet événement n'est pas en attente de modération",
        },
        { status: 400 },
      );
    }

    const updated = await prisma.evenement.update({
      where: { id },
      data: {
        statut: decision,
      },
    });

    return NextResponse.json({
      message:
        decision === "PUBLIE"
          ? "Événement publié avec succès"
          : `Événement retourné en brouillon${raison ? ` — ${raison}` : ""}`,
      evenement: updated,
    });
  } catch (error) {
    console.error("Erreur validation admin:", error);

    return NextResponse.json({ erreur: "Erreur serveur" }, { status: 500 });
  }
}
