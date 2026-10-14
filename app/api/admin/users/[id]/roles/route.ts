import { NextResponse } from "next/server";
import { verifierRoleUser } from "@/app/lib/getUser";
import { prisma } from "@/app/lib/prisma";
import type { Role } from "@/app/generated/prisma/enums";

const ROLES_VALIDES = [
  "ACHETEUR",
  "PROMOTEUR",
  "AGENT",
  "PRESTATAIRE",
  "ADMIN",
];

// ─── POST — Ajouter un rôle ──────────────────────────────────
export async function POST(
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
    const { role } = await request.json();

    // Valider le rôle
    if (!role || !ROLES_VALIDES.includes(role)) {
      return NextResponse.json(
        {
          erreur: `Rôle invalide : "${role}"`,
          rolesAcceptes: ROLES_VALIDES,
        },
        { status: 400 },
      );
    }

    // Vérifier que l'utilisateur existe
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

    // Vérifier que l'utilisateur n'a pas déjà ce rôle
    if (user.roles.some((r) => r.role === role)) {
      return NextResponse.json(
        { erreur: `L'utilisateur a déjà le rôle ${role}` },
        { status: 409 },
      );
    }

    // Ajouter le rôle
    await prisma.userRole.create({
      data: { userId: id, role },
    });

    const userMisAJour = await prisma.user.findUnique({
      where: { id },
      include: { roles: true },
    });

    return NextResponse.json({
      message: `Rôle ${role} ajouté avec succès`,
      user: {
        id: userMisAJour?.id,
        email: userMisAJour?.email,
        nom: userMisAJour?.nom,
        roles: userMisAJour?.roles.map((r) => r.role),
      },
    });
  } catch (error) {
    console.error("Erreur POST roles:", error);
    return NextResponse.json({ erreur: "Erreur serveur" }, { status: 500 });
  }
}

// ─── DELETE — Retirer un rôle ────────────────────────────────
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
    const { role } = await request.json();

    if (!role || !ROLES_VALIDES.includes(role)) {
      return NextResponse.json(
        {
          erreur: `Rôle invalide : "${role}"`,
          rolesAcceptes: ROLES_VALIDES,
        },
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

    // Empêcher de retirer le dernier rôle
    if (user.roles.length === 1) {
      return NextResponse.json(
        { erreur: "Impossible de retirer le dernier rôle" },
        { status: 400 },
      );
    }

    // Vérifier que l'utilisateur a bien ce rôle
    if (!user.roles.some((r) => r.role === role)) {
      return NextResponse.json(
        { erreur: `L'utilisateur n'a pas le rôle ${role}` },
        { status: 404 },
      );
    }

    await prisma.userRole.deleteMany({
      where: { userId: id, role },
    });

    const userMisAJour = await prisma.user.findUnique({
      where: { id },
      include: { roles: true },
    });

    return NextResponse.json({
      message: `Rôle ${role} retiré avec succès`,
      user: {
        id: userMisAJour?.id,
        email: userMisAJour?.email,
        nom: userMisAJour?.nom,
        roles: userMisAJour?.roles.map((r) => r.role),
      },
    });
  } catch (error) {
    console.error("Erreur DELETE roles:", error);
    return NextResponse.json({ erreur: "Erreur serveur" }, { status: 500 });
  }
}

// ─── PUT — Remplacer tous les rôles ─────────────────────────
export async function PUT(
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
    const { roles } = await request.json();

    // Validation
    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      return NextResponse.json(
        { erreur: "Au moins un rôle est requis" },
        { status: 400 },
      );
    }

    const roleInvalide = roles.find((r: string) => !ROLES_VALIDES.includes(r));
    if (roleInvalide) {
      return NextResponse.json(
        {
          erreur: `Rôle invalide : "${roleInvalide}"`,
          rolesAcceptes: ROLES_VALIDES,
        },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json(
        { erreur: "Utilisateur introuvable" },
        { status: 404 },
      );
    }

    // Remplacer tous les rôles dans une transaction
    await prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({ where: { userId: id } });
      await tx.userRole.createMany({
        data: roles.map((role: string) => ({ userId: id, role: role as Role })),
      });
    });

    const userMisAJour = await prisma.user.findUnique({
      where: { id },
      include: { roles: true },
    });

    return NextResponse.json({
      message: "Rôles mis à jour avec succès",
      user: {
        id: userMisAJour?.id,
        email: userMisAJour?.email,
        nom: userMisAJour?.nom,
        roles: userMisAJour?.roles.map((r) => r.role),
      },
    });
  } catch (error) {
    console.error("Erreur PUT roles:", error);
    return NextResponse.json({ erreur: "Erreur serveur" }, { status: 500 });
  }
}
