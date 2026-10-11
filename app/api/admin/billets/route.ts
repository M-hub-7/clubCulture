import { NextResponse } from "next/server";
import { verifierRoleUser } from "@/app/lib/getUser";
import { prisma } from "@/app/lib/prisma";

// GET — Admin voit tous les billets d'un événement
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
    const evenementId = searchParams.get("evenementId");
    const statut = searchParams.get("statut");

    if (!evenementId) {
      return NextResponse.json(
        { erreur: "evenementId est requis" },
        { status: 400 },
      );
    }

    const billets = await prisma.billet.findMany({
      where: {
        commande: { evenementId },
        ...(statut && { statut: statut as any }),
      },
      include: {
        commande: {
          include: {
            acheteur: { select: { nom: true, email: true } },
          },
        },
        categorie: { select: { libelle: true } },
        scans: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    });

    // Stats globales
    const stats = {
      total: billets.length,
      valides: billets.filter((b) => b.statut === "VALIDE").length,
      utilises: billets.filter((b) => b.statut === "UTILISE").length,
      annules: billets.filter((b) => b.statut === "ANNULE").length,
      rembourses: billets.filter((b) => b.statut === "REMBOURSE").length,
    };

    return NextResponse.json({ billets, stats });
  } catch (error) {
    console.error("Erreur GET admin/billets:", error);
    return NextResponse.json({ erreur: "Erreur serveur" }, { status: 500 });
  }
}
