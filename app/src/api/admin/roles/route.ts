import { NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

const TOUS_LES_ROLES = [
  "ACHETEUR",
  "PROMOTEUR",
  "AGENT",
  "PRESTATAIRE",
  "ADMIN",
];

async function verifierAdmin() {
  const session = await auth();
  if (!session?.user) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { roles: true },
  });
  return user?.roles.some((r) => r.role === "ADMIN") ? session : null;
}

// POST — Ajouter un rôle
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await verifierAdmin();
    if (!session) {
      return NextResponse.json(
        { erreur: "Accès refusé — Admin uniquement" },
        { status: 403 },
      );
    }

    const { role } = await request.json();

    if (!TOUS_LES_ROLES.includes(role)) {
      return NextResponse.json(
        {
          erreur: `Rôle invalide. Rôles disponibles : ${TOUS_LES_ROLES.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: { roles: true },
    });

    if (!user) {
      return NextResponse.json(
        { erreur: "Utilisateur introuvable" },
        { status: 404 },
      );
    }

    if (user.roles.some((r) => r.role === role)) {
      return NextResponse.json(
        { erreur: `L'utilisateur a déjà le rôle ${role}` },
        { status: 409 },
      );
    }

    await prisma.userRole.create({
      data: { userId: params.id, role },
    });

    const userMisAJour = await prisma.user.findUnique({
      where: { id: params.id },
      include: { roles: true },
    });

    return NextResponse.json({
      message: `Rôle ${role} ajouté`,
      user: {
        id: userMisAJour?.id,
        email: userMisAJour?.email,
        roles: userMisAJour?.roles.map((r) => r.role),
      },
    });
  } catch (error) {
    return NextResponse.json({ erreur: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE — Retirer un rôle
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await verifierAdmin();
    if (!session) {
      return NextResponse.json(
        { erreur: "Accès refusé — Admin uniquement" },
        { status: 403 },
      );
    }

    const { role } = await request.json();

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: { roles: true },
    });

    if (!user) {
      return NextResponse.json(
        { erreur: "Utilisateur introuvable" },
        { status: 404 },
      );
    }

    if (user.roles.length === 1) {
      return NextResponse.json(
        { erreur: "Impossible de retirer le dernier rôle" },
        { status: 400 },
      );
    }

    await prisma.userRole.deleteMany({
      where: { userId: params.id, role },
    });

    const userMisAJour = await prisma.user.findUnique({
      where: { id: params.id },
      include: { roles: true },
    });

    return NextResponse.json({
      message: `Rôle ${role} retiré`,
      user: {
        id: userMisAJour?.id,
        email: userMisAJour?.email,
        roles: userMisAJour?.roles.map((r) => r.role),
      },
    });
  } catch (error) {
    return NextResponse.json({ erreur: "Erreur serveur" }, { status: 500 });
  }
}
