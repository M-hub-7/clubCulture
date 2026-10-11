import { NextResponse } from "next/server";
import { verifierRole } from "@/app/lib/verifierRole";
import { prisma } from "@/app/lib/prisma";

// GET — Liste tous les événements publiés
// GET — Liste tous les événements publiés
export async function GET(request: Request) {
  try {
    // ...
    const { searchParams } = new URL(request.url);

    const page = Number(searchParams.get("page") || 1);
    const limite = Number(searchParams.get("limite") || 10);

    const skip = (page - 1) * limite;

    const evenements = await prisma.evenement.findMany({
      where: {
        statut: "PUBLIE",
        dateDebut: {
          gte: new Date(),
        },
      },

      include: {
        categories: true,

        promoteur: {
          select: {
            id: true,
            nom: true,
          },
        },
      },

      orderBy: {
        dateDebut: "asc",
      },

      skip,
      take: limite,
    });

    return NextResponse.json({
      evenements,
    });
  } catch (error) {
    console.error("Erreur GET evenements:", error);

    return NextResponse.json(
      {
        erreur: "Erreur serveur",
      },
      {
        status: 500,
      },
    );
  }
}

// POST — Créer un événement (Promoteur uniquement)
export async function POST(request: Request) {
  try {
    // Vérifier l'authentification et le rôle PROMOTEUR
    const user = await verifierRole("PROMOTEUR");

    if (!user) {
      return NextResponse.json(
        {
          erreur: "Non authentifié ou rôle PROMOTEUR requis",
        },
        {
          status: 403,
        },
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
      categories,
      soumettreAmoderation = false,
    } = body;

    // Validation des champs obligatoires
    if (!titre || !description || !lieu || !ville || !dateDebut || !dateFin) {
      return NextResponse.json(
        {
          erreur: "Champs obligatoires manquants",
        },
        {
          status: 400,
        },
      );
    }

    // Conversion des dates principales
    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);

    if (Number.isNaN(debut.getTime()) || Number.isNaN(fin.getTime())) {
      return NextResponse.json(
        {
          erreur: "Dates de l'événement invalides",
        },
        {
          status: 400,
        },
      );
    }

    if (fin <= debut) {
      return NextResponse.json(
        {
          erreur: "La date de fin doit être postérieure à la date de début",
        },
        {
          status: 400,
        },
      );
    }

    // Préparer les catégories
    let categoriesData: any[] = [];

    if (Array.isArray(categories)) {
      categoriesData = categories.map((c: any) => {
        const ouverture = c.ouverture ? new Date(c.ouverture) : new Date();

        const fermeture = c.fermeture ? new Date(c.fermeture) : fin;

        // Si les dates de catégorie sont invalides,
        // utiliser les dates de l'événement.
        const ouvertureValide = Number.isNaN(ouverture.getTime())
          ? debut
          : ouverture;

        const fermetureValide = Number.isNaN(fermeture.getTime())
          ? fin
          : fermeture;

        return {
          libelle: c.libelle,
          prix: Number(c.prix),
          quantite: Number(c.quantite),
          ouverture: ouvertureValide,
          fermeture: fermetureValide,
        };
      });
    }

    const soumettre = soumettreAmoderation === true;

    if (soumettre) {
      if (!Array.isArray(styles) || styles.length === 0) {
        return NextResponse.json(
          { erreur: "Sélectionnez au moins un style pour soumettre l'événement." },
          { status: 400 },
        );
      }
      if (!Array.isArray(categories) || categories.length === 0) {
        return NextResponse.json(
          { erreur: "Ajoutez au moins une catégorie de billet avant de soumettre l'événement." },
          { status: 400 },
        );
      }
      if (debut <= new Date()) {
        return NextResponse.json(
          { erreur: "La date de début doit être dans le futur pour soumettre l'événement." },
          { status: 400 },
        );
      }
      const categorieInvalide = categoriesData.some((c) =>
        !String(c.libelle ?? "").trim() ||
        !Number.isInteger(c.prix) || c.prix < 0 ||
        !Number.isInteger(c.quantite) || c.quantite <= 0 ||
        c.fermeture <= c.ouverture
      );
      if (categorieInvalide) {
        return NextResponse.json(
          { erreur: "Une ou plusieurs catégories de billets sont invalides." },
          { status: 400 },
        );
      }
    }

    // Créer le brouillon, ou le placer en modération si le promoteur le demande.
    const evenement = await prisma.evenement.create({
      data: {
        titre,
        description,
        visuel: visuel || null,
        statut: soumettre ? "EN_MODERATION" : "BROUILLON",
        lieu,
        ville,
        adresse,

        dateDebut: debut,
        dateFin: fin,

        styles: Array.isArray(styles) ? styles : [],

        // Utilisateur authentifié
        promoteurId: user.id,

        // Catégories de billets
        categories: {
          create: categoriesData,
        },
      },

      include: {
        categories: true,
      },
    });

    return NextResponse.json(
      {
        evenement,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Erreur POST evenement:", error);

    return NextResponse.json(
      {
        erreur: "Erreur serveur",
      },
      {
        status: 500,
      },
    );
  }
}
