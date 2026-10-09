import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { verifierRoleUser } from "@/app/lib/getUser";

export async function GET(request: Request) {
  try {
    const session = await verifierRoleUser(request, "ADMIN");

    if (!session) {
      return NextResponse.json(
        { erreur: "Accès refusé — Admin uniquement" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);

    const statut = searchParams.get("statut");
    const recherche = searchParams.get("q")?.trim();
    const statutsAutorises = ["BROUILLON", "EN_MODERATION", "PUBLIE", "ANNULE", "TERMINE"];
    if (statut && !statutsAutorises.includes(statut)) {
      return NextResponse.json({ erreur: "Statut d'événement invalide." }, { status: 400 });
    }

    const evenements = await prisma.evenement.findMany({
      where: {
        ...(statut && {
          statut: statut as any,
        }),

        ...(recherche && {
          OR: [
            {
              titre: {
                contains: recherche,
                mode: "insensitive",
              },
            },
            {
              ville: {
                contains: recherche,
                mode: "insensitive",
              },
            },
          ],
        }),
      },

      include: {
        promoteur: {
          select: {
            id: true,
            nom: true,
            email: true,
          },
        },

        categories: {
          select: {
            id: true,
            libelle: true,
            prix: true,
            quantite: true,
            vendu: true,
          },
        },

        _count: {
          select: {
            commandes: true,
            beneficiaires: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(evenements);
  } catch (error) {
    console.error("Erreur GET admin/evenements:", error);

    return NextResponse.json({ erreur: "Erreur serveur" }, { status: 500 });
  }
}
