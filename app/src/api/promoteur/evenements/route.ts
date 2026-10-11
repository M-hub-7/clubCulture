import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { verifierRole } from "@/app/lib/verifierRole";

// GET — Mes événements (Promoteur connecté)
export async function GET(request: Request) {
  try {
    const user = await verifierRole("PROMOTEUR");

    if (!user) {
      return NextResponse.json(
        { erreur: "Accès refusé — rôle PROMOTEUR requis" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const statut = searchParams.get("statut");

    const evenements = await prisma.evenement.findMany({
      where: {
        promoteurId: user.id,
        ...(statut && { statut: statut as any }),
      },

      include: {
        categories: true,

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

    // Calcul des statistiques pour chaque événement
    const evenementsAvecStats = await Promise.all(
      evenements.map(async (evt) => {
        const stats = await prisma.commande.aggregate({
          where: {
            evenementId: evt.id,
            statut: "PAYEE",
          },

          _sum: {
            montantTotal: true,
          },

          _count: {
            id: true,
          },
        });

        return {
          ...evt,

          stats: {
            totalVentes: stats._count.id,
            totalRecettes: stats._sum.montantTotal || 0,

            placesVendues: evt.categories.reduce((acc, c) => acc + c.vendu, 0),

            placesTotal: evt.categories.reduce((acc, c) => acc + c.quantite, 0),
          },
        };
      }),
    );

    return NextResponse.json(evenementsAvecStats);
  } catch (error) {
    console.error("Erreur GET promoteur/evenements:", error);

    return NextResponse.json({ erreur: "Erreur serveur" }, { status: 500 });
  }
}
