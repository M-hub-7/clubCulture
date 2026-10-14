import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { verifierRole } from "@/app/lib/verifierRole";

// GET — Événements publiés scannables (en cours ou à venir)
export async function GET() {
  try {
    const agent = await verifierRole("AGENT");
    if (!agent) {
      return NextResponse.json(
        { erreur: "Non authentifié ou rôle AGENT requis" },
        { status: 401 },
      );
    }

    // Tolérance de 12 h après la fin (sorties, retardataires)
    const limite = new Date(Date.now() - 12 * 3600 * 1000);

    const evenements = await prisma.evenement.findMany({
      where: { statut: "PUBLIE", dateFin: { gte: limite } },
      select: {
        id: true,
        titre: true,
        lieu: true,
        ville: true,
        dateDebut: true,
        dateFin: true,
      },
      orderBy: { dateDebut: "asc" },
    });

    return NextResponse.json(evenements);
  } catch (error) {
    console.error("Erreur GET scan/evenements:", error);
    return NextResponse.json({ erreur: "Erreur serveur" }, { status: 500 });
  }
}
