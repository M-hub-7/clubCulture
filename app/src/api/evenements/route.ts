import { NextResponse } from "next/server";
import { verifierRole } from "@/app/lib/verifierRole";
import { prisma } from "@/app/lib/prisma";

// GET — Liste tous les événements publiés
// GET — Liste tous les événements publiés
export async function GET(request: Request) {
  try {
    // ...

    const evenements = await prisma.evenement.findMany({
      // ...
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
      lieu,
      ville,
      adresse,
      dateDebut,
      dateFin,
      styles,
      categories,
    } = body;

    // Validation des champs obligatoires
    if (!titre || !lieu || !ville || !dateDebut || !dateFin) {
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
        const ouverture = c.ouverture ? new Date(c.ouverture) : debut;

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

    // Créer l'événement
    const evenement = await prisma.evenement.create({
      data: {
        titre,
        description,
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
