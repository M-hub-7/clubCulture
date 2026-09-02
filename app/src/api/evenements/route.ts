import { NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

// GET — Liste tous les événements publiés
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    const ville = searchParams.get("ville");
    const style = searchParams.get("style");

    const evenements = await prisma.evenement.findMany({
      where: {
        statut: "PUBLIE",
        dateDebut: { gte: new Date() },
        ...(q && {
          OR: [
            { titre: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { lieu: { contains: q, mode: "insensitive" } },
          ],
        }),
        ...(ville && {
          ville: { equals: ville, mode: "insensitive" },
        }),
        ...(style && {
          styles: { has: style },
        }),
      },
      include: {
        promoteur: { select: { id: true, nom: true, email: true } },
        categories: true,
        _count: { select: { commandes: true } },
      },
      orderBy: { dateDebut: "asc" },
    });

    return NextResponse.json(evenements);
  } catch (error) {
    console.error("Erreur GET evenements:", error);
    return NextResponse.json({ erreur: "Erreur serveur" }, { status: 500 });
  }
}

// POST — Créer un événement (Promoteur uniquement)
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ erreur: "Non authentifié" }, { status: 401 });
    }

    // Vérifier le rôle PROMOTEUR
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { roles: true },
    });

    const estPromoteur = user?.roles.some((r) => r.role === "PROMOTEUR");
    if (!estPromoteur) {
      return NextResponse.json(
        { erreur: "Accès refusé — rôle PROMOTEUR requis" },
        { status: 403 },
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

    // Validation
    if (!titre || !lieu || !ville || !dateDebut || !dateFin) {
      return NextResponse.json(
        { erreur: "Champs obligatoires manquants" },
        { status: 400 },
      );
    }

    // Créer l'événement avec ses catégories de billets
    const evenement = await prisma.evenement.create({
      data: {
        titre,
        description,
        lieu,
        ville,
        adresse,
        dateDebut: new Date(dateDebut),
        dateFin: new Date(dateFin),
        styles: styles || [],
        promoteurId: session.user.id,
        categories: {
          create:
            categories?.map((c: any) => ({
              libelle: c.libelle,
              prix: c.prix,
              quantite: c.quantite,
              ouverture: new Date(c.ouverture),
              fermeture: new Date(c.fermeture),
            })) || [],
        },
      },
      include: { categories: true },
    });

    return NextResponse.json(evenement, { status: 201 });
  } catch (error) {
    console.error("Erreur POST evenement:", error);
    return NextResponse.json({ erreur: "Erreur serveur" }, { status: 500 });
  }
}
