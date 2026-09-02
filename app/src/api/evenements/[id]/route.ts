import { NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

// GET — Récupérer un événement
export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const evenement = await prisma.evenement.findUnique({
      where: { id: params.id },
      include: {
        promoteur: { select: { id: true, nom: true, email: true } },
        categories: true,
        beneficiaires: {
          include: { user: { select: { nom: true, email: true } } },
        },
        _count: { select: { commandes: true } },
      },
    });

    if (!evenement) {
      return NextResponse.json(
        { erreur: "Événement non trouvé" },
        { status: 404 },
      );
    }

    return NextResponse.json(evenement);
  } catch (error) {
    return NextResponse.json({ erreur: "Erreur serveur" }, { status: 500 });
  }
}

// PUT — Modifier un événement
export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ erreur: "Non authentifié" }, { status: 401 });
    }

    const evenement = await prisma.evenement.findUnique({
      where: { id: params.id },
    });

    if (!evenement) {
      return NextResponse.json(
        { erreur: "Événement non trouvé" },
        { status: 404 },
      );
    }

    // Vérifier que c'est le bon promoteur
    if (evenement.promoteurId !== session.user.id) {
      return NextResponse.json({ erreur: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json();

    const updated = await prisma.evenement.update({
      where: { id: params.id },
      data: {
        titre: body.titre,
        description: body.description,
        lieu: body.lieu,
        ville: body.ville,
        adresse: body.adresse,
        dateDebut: body.dateDebut ? new Date(body.dateDebut) : undefined,
        dateFin: body.dateFin ? new Date(body.dateFin) : undefined,
        styles: body.styles,
      },
      include: { categories: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ erreur: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE — Annuler un événement
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ erreur: "Non authentifié" }, { status: 401 });
    }

    const evenement = await prisma.evenement.findUnique({
      where: { id: params.id },
    });

    if (!evenement) {
      return NextResponse.json(
        { erreur: "Événement non trouvé" },
        { status: 404 },
      );
    }

    if (evenement.promoteurId !== session.user.id) {
      return NextResponse.json({ erreur: "Accès refusé" }, { status: 403 });
    }

    // On annule plutôt que supprimer
    await prisma.evenement.update({
      where: { id: params.id },
      data: { statut: "ANNULE" },
    });

    return NextResponse.json({ message: "Événement annulé" });
  } catch (error) {
    return NextResponse.json({ erreur: "Erreur serveur" }, { status: 500 });
  }
}
