import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { verifierRole } from "@/app/lib/verifierRole";

// GET — Consulter un événement
// GET — Consulter un événement
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id || id === "undefined") {
      return NextResponse.json(
        { erreur: "ID de l'événement invalide" },
        { status: 400 },
      );
    }

    const evenement = await prisma.evenement.findUnique({
      where: { id },
      include: {
        categories: true,
        promoteur: {
          select: {
            id: true,
            nom: true,
            email: true,
          },
        },
        _count: {
          select: {
            commandes: true,
          },
        },
      },
    });

    if (!evenement) {
      return NextResponse.json(
        { erreur: "Événement introuvable" },
        { status: 404 },
      );
    }

    // Un événement publié est accessible publiquement
    if (evenement.statut === "PUBLIE") {
      return NextResponse.json(evenement);
    }

    // Les événements non publiés nécessitent une authentification
    const user = await verifierRole("PROMOTEUR");

    // Pas de promoteur connecté
    if (!user) {
      return NextResponse.json(
        { erreur: "Événement introuvable" },
        { status: 404 },
      );
    }

    // Seul le propriétaire peut consulter son événement non publié
    if (evenement.promoteurId !== user.id) {
      return NextResponse.json(
        { erreur: "Événement introuvable" },
        { status: 404 },
      );
    }

    return NextResponse.json(evenement);
  } catch (error) {
    console.error("Erreur GET événement:", error);

    return NextResponse.json({ erreur: "Erreur serveur" }, { status: 500 });
  }
}

// PUT — Modifier un événement
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await verifierRole("PROMOTEUR");

    if (!user) {
      return NextResponse.json(
        { erreur: "Accès refusé — rôle PROMOTEUR requis" },
        { status: 403 },
      );
    }

    const { id } = await params;

    if (!id || id === "undefined") {
      return NextResponse.json(
        { erreur: "ID de l'événement invalide" },
        { status: 400 },
      );
    }

    const evenement = await prisma.evenement.findUnique({
      where: { id },
      include: {
        categories: true,
      },
    });

    if (!evenement) {
      return NextResponse.json(
        { erreur: "Événement introuvable" },
        { status: 404 },
      );
    }

    // Un promoteur ne peut modifier que son propre événement
    if (evenement.promoteurId !== user.id) {
      return NextResponse.json({ erreur: "Accès refusé" }, { status: 403 });
    }

    // Un événement déjà publié ne doit plus être modifié
    if (evenement.statut === "PUBLIE") {
      return NextResponse.json(
        {
          erreur: "Un événement déjà publié ne peut plus être modifié",
        },
        { status: 400 },
      );
    }

    const body = await request.json();

    const {
      titre,
      description,
      visuel,
      lieu,
      ville,
      adresse,
      dateDebut,
      dateFin,
      styles,
    } = body;

    const data: any = {};

    if (titre !== undefined) data.titre = titre;
    if (description !== undefined) data.description = description;
    if (visuel !== undefined) data.visuel = visuel || null;
    if (lieu !== undefined) data.lieu = lieu;
    if (ville !== undefined) data.ville = ville;
    if (adresse !== undefined) data.adresse = adresse;
    if (styles !== undefined) {
      data.styles = Array.isArray(styles) ? styles : [];
    }

    if (dateDebut !== undefined) {
      const nouvelleDateDebut = new Date(dateDebut);

      if (Number.isNaN(nouvelleDateDebut.getTime())) {
        return NextResponse.json(
          { erreur: "Date de début invalide" },
          { status: 400 },
        );
      }

      data.dateDebut = nouvelleDateDebut;
    }

    if (dateFin !== undefined) {
      const nouvelleDateFin = new Date(dateFin);

      if (Number.isNaN(nouvelleDateFin.getTime())) {
        return NextResponse.json(
          { erreur: "Date de fin invalide" },
          { status: 400 },
        );
      }

      data.dateFin = nouvelleDateFin;
    }

    // Vérifier la cohérence des dates finales
    const dateDebutFinale = data.dateDebut ?? evenement.dateDebut;

    const dateFinFinale = data.dateFin ?? evenement.dateFin;

    if (dateFinFinale <= dateDebutFinale) {
      return NextResponse.json(
        {
          erreur: "La date de fin doit être postérieure à la date de début",
        },
        { status: 400 },
      );
    }

    const updated = await prisma.evenement.update({
      where: { id },

      data,

      include: {
        categories: true,
      },
    });

    return NextResponse.json({
      evenement: updated,
    });
  } catch (error) {
    console.error("Erreur PUT événement:", error);

    return NextResponse.json({ erreur: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE — Supprimer un événement
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await verifierRole("PROMOTEUR");

    if (!user) {
      return NextResponse.json(
        { erreur: "Accès refusé — rôle PROMOTEUR requis" },
        { status: 403 },
      );
    }

    const { id } = await params;

    if (!id || id === "undefined") {
      return NextResponse.json(
        { erreur: "ID de l'événement invalide" },
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

    if (evenement.promoteurId !== user.id) {
      return NextResponse.json({ erreur: "Accès refusé" }, { status: 403 });
    }

    await prisma.evenement.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Événement supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur DELETE événement:", error);

    return NextResponse.json({ erreur: "Erreur serveur" }, { status: 500 });
  }
}
