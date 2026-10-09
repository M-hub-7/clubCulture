import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { verifierRole } from "@/app/lib/verifierRole";

export async function GET() {
  try {
    const admin = await verifierRole("ADMIN");

    if (!admin) {
      return NextResponse.json(
        { erreur: "Authentification administrateur requise." },
        { status: 401 },
      );
    }

    const billets = await prisma.billet.findMany({
      where: {
        statut: "EN_ATTENTE_VALIDATION",
      },
      include: {
        categorie: {
          include: {
            evenement: {
              select: {
                id: true,
                titre: true,
                dateDebut: true,
                lieu: true,
              },
            },
          },
        },
        commande: {
          include: {
            acheteur: {
              select: {
                id: true,
                nom: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({ billets });
  } catch (error) {
    console.error("Erreur GET /api/admin/billets :", error);

    return NextResponse.json(
      { erreur: "Impossible de charger les billets." },
      { status: 500 },
    );
  }
}
