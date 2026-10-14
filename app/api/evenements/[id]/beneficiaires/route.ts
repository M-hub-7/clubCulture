import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { verifierRoleUser } from "@/app/lib/getUser";

// GET — Liste des bénéficiaires d'un événement
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await verifierRoleUser(request, "PROMOTEUR");
    if (!session) {
      return NextResponse.json({ erreur: "Accès refusé" }, { status: 403 });
    }

    const { id } = await params;

    // Seul le promoteur propriétaire (ou un admin) voit les bénéficiaires
    const evenement = await prisma.evenement.findUnique({
      where: { id },
      select: { promoteurId: true },
    });

    if (
      !evenement ||
      (evenement.promoteurId !== session.user.id &&
        !session.user.roles.includes("ADMIN"))
    ) {
      return NextResponse.json(
        { erreur: "Événement introuvable ou accès refusé" },
        { status: 403 },
      );
    }

    const beneficiaires = await prisma.beneficiaire.findMany({
      where: { evenementId: id },
      include: {
        user: { select: { id: true, nom: true, email: true } },
        versements: true,
      },
    });

    // Calculer le total déjà alloué
    const totalAlloue = beneficiaires.reduce((acc, b) => {
      if (b.typePart === "FIXE") return acc + b.valeur;
      return acc;
    }, 0);

    return NextResponse.json({ beneficiaires, totalAlloue });
  } catch (error) {
    console.error("Erreur bénéficiaires:", error);
    return NextResponse.json({ erreur: "Erreur serveur" }, { status: 500 });
  }
}

// POST — Ajouter un bénéficiaire
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await verifierRoleUser(request, "PROMOTEUR");
    if (!session) {
      return NextResponse.json({ erreur: "Accès refusé" }, { status: 403 });
    }

    const { id } = await params;
    const { userId, role, typePart, valeur } = await request.json();

    if (!userId || !role || !typePart || valeur === undefined) {
      return NextResponse.json(
        { erreur: "userId, role, typePart et valeur sont obligatoires" },
        { status: 400 },
      );
    }

    if (!["FIXE", "POURCENTAGE"].includes(typePart)) {
      return NextResponse.json(
        { erreur: "typePart doit être FIXE ou POURCENTAGE" },
        { status: 400 },
      );
    }

    if (!Number.isInteger(valeur) || valeur < 0) {
      return NextResponse.json(
        { erreur: "valeur doit être un entier positif (centimes ou %)" },
        { status: 400 },
      );
    }

    if (typePart === "POURCENTAGE" && valeur > 100) {
      return NextResponse.json(
        { erreur: "Le pourcentage doit être entre 0 et 100" },
        { status: 400 },
      );
    }

    // Vérifier que l'événement appartient au promoteur
    const evenement = await prisma.evenement.findUnique({
      where: { id },
    });

    if (!evenement || evenement.promoteurId !== session.user.id) {
      return NextResponse.json(
        { erreur: "Événement introuvable ou accès refusé" },
        { status: 403 },
      );
    }

    const utilisateur = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!utilisateur) {
      return NextResponse.json(
        { erreur: "Utilisateur bénéficiaire introuvable" },
        { status: 404 },
      );
    }

    // La somme des pourcentages ne peut pas dépasser 100 %
    if (typePart === "POURCENTAGE") {
      const { _sum } = await prisma.beneficiaire.aggregate({
        where: { evenementId: id, typePart: "POURCENTAGE" },
        _sum: { valeur: true },
      });
      if ((_sum.valeur ?? 0) + valeur > 100) {
        return NextResponse.json(
          { erreur: "La somme des pourcentages dépasserait 100 %" },
          { status: 400 },
        );
      }
    }

    const beneficiaire = await prisma.beneficiaire.create({
      data: {
        evenementId: id,
        userId,
        role,
        typePart,
        valeur,
      },
      include: {
        user: { select: { nom: true, email: true } },
      },
    });

    return NextResponse.json(
      {
        message: "Bénéficiaire ajouté avec succès",
        beneficiaire,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erreur bénéficiaires:", error);
    return NextResponse.json({ erreur: "Erreur serveur" }, { status: 500 });
  }
}
