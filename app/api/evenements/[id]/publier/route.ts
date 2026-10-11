import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { verifierRoleUser } from "@/app/lib/getUser";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await verifierRoleUser(request, "PROMOTEUR");
    if (!session) {
      return NextResponse.json(
        { erreur: "Accès refusé — rôle PROMOTEUR requis" },
        { status: 403 },
      );
    }

    const { id } = await params;

    const evenement = await prisma.evenement.findUnique({
      where: { id },
      include: { categories: true },
    });

    if (!evenement) {
      return NextResponse.json(
        { erreur: "Événement introuvable" },
        { status: 404 },
      );
    }

    // Vérifier que c'est bien le promoteur de cet événement
    if (evenement.promoteurId !== session.user.id) {
      return NextResponse.json(
        { erreur: "Vous ne pouvez publier que vos propres événements" },
        { status: 403 },
      );
    }

    // Vérifier que l'événement est en brouillon
    if (evenement.statut !== "BROUILLON") {
      return NextResponse.json(
        {
          erreur: `Impossible de soumettre un événement en statut "${evenement.statut}". Seuls les brouillons peuvent être soumis.`,
        },
        { status: 400 },
      );
    }

    // Vérifier qu'il y a au moins une catégorie de billet
    if (evenement.categories.length === 0) {
      return NextResponse.json(
        {
          erreur: "Ajoutez au moins une catégorie de billet avant de soumettre",
        },
        { status: 400 },
      );
    }

    // Vérifier que la date de début est dans le futur
    if (new Date(evenement.dateDebut) <= new Date()) {
      return NextResponse.json(
        {
          erreur:
            "La date de début doit être dans le futur pour soumettre l'événement",
        },
        { status: 400 },
      );
    }

    // Passer en modération — l'admin devra valider
    const updated = await prisma.evenement.update({
      where: { id },
      data: { statut: "EN_MODERATION" },
      include: {
        categories: true,
        promoteur: { select: { id: true, nom: true, email: true } },
      },
    });

    return NextResponse.json({
      message:
        "Événement soumis à modération — en attente de validation par l'admin",
      evenement: updated,
    });
  } catch (error) {
    console.error("Erreur POST publier:", error);
    return NextResponse.json({ erreur: "Erreur serveur" }, { status: 500 });
  }
}
