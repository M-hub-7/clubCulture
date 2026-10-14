import { NextResponse } from "next/server";
import { verifierRoleUser } from "@/app/lib/getUser";
import { prisma } from "@/app/lib/prisma";

// GET — Détail d'un utilisateur
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await verifierRoleUser(request, "ADMIN");

    if (!session) {
      return NextResponse.json(
        { erreur: "Accès refusé — Admin uniquement" },
        { status: 403 },
      );
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        roles: true,
        evenements: {
          select: { id: true, titre: true, statut: true },
        },
        commandes: {
          select: { id: true, montantTotal: true, statut: true },
          take: 5,
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            evenements: true,
            commandes: true,
            beneficiaires: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { erreur: "Utilisateur introuvable" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      nom: user.nom,
      emailVerifie: user.emailVerifie,
      roles: user.roles.map((r) => r.role),
      createdAt: user.createdAt,
      evenements: user.evenements,
      commandes: user.commandes,
      stats: user._count,
    });
  } catch (error) {
    console.error("Erreur GET admin/users/[id]:", error);
    return NextResponse.json({ erreur: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE — Supprimer un utilisateur
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await verifierRoleUser(request, "ADMIN");
    if (!session) {
      return NextResponse.json(
        { erreur: "Accès refusé — Admin uniquement" },
        { status: 403 },
      );
    }

    const { id } = await params;

    // Empêcher de supprimer son propre compte
    if (id === session.user.id) {
      return NextResponse.json(
        { erreur: "Impossible de supprimer votre propre compte" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: { roles: true },
    });

    if (!user) {
      return NextResponse.json(
        { erreur: "Utilisateur introuvable" },
        { status: 404 },
      );
    }

    // Supprimer l'utilisateur
    await prisma.user.delete({ where: { id } });

    return NextResponse.json({
      message: `Utilisateur ${user.email} supprimé`,
    });
  } catch (error) {
    console.error("Erreur DELETE admin/users/[id]:", error);
    return NextResponse.json({ erreur: "Erreur serveur" }, { status: 500 });
  }
}
