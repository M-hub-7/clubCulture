import { NextResponse } from "next/server";
import { getUser } from "@/app/lib/getUser";
import { prisma } from "@/app/lib/prisma";

const TOUS_LES_ROLES = [
  "ACHETEUR",
  "PROMOTEUR",
  "AGENT",
  "PRESTATAIRE",
  "ADMIN",
] as const;

type Role = (typeof TOUS_LES_ROLES)[number];

async function verifierAdmin(request: Request) {
  const session = await getUser(request);

  if (!session?.user) {
    return null;
  }

  if (!session.user.roles.includes("ADMIN")) {
    return null;
  }

  return session;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await verifierAdmin(request);

    if (!session) {
      return NextResponse.json(
        {
          erreur: "Accès refusé — Admin uniquement.",
        },
        {
          status: 403,
        },
      );
    }

    const { id } = await params;

    const body = await request.json();

    const role = body.role as Role;

    if (!TOUS_LES_ROLES.includes(role)) {
      return NextResponse.json(
        {
          erreur: `Rôle invalide. Rôles disponibles : ${TOUS_LES_ROLES.join(", ")}`,
        },
        {
          status: 400,
        },
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id,
      },
      include: {
        roles: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          erreur: "Utilisateur introuvable.",
        },
        {
          status: 404,
        },
      );
    }

    if (user.roles.some((r) => r.role === role)) {
      return NextResponse.json(
        {
          erreur: `L'utilisateur possède déjà le rôle ${role}.`,
        },
        {
          status: 409,
        },
      );
    }

    await prisma.userRole.create({
      data: {
        userId: id,
        role,
      },
    });

    const userMisAJour = await prisma.user.findUnique({
      where: {
        id,
      },
      include: {
        roles: true,
      },
    });

    return NextResponse.json({
      message: `Rôle ${role} ajouté.`,
      user: {
        id: userMisAJour?.id,
        email: userMisAJour?.email,
        roles: userMisAJour?.roles.map((r) => r.role),
      },
    });
  } catch (error) {
    console.error("Erreur ajout rôle :", error);

    return NextResponse.json(
      {
        erreur: "Erreur serveur.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await verifierAdmin(request);

    if (!session) {
      return NextResponse.json(
        {
          erreur: "Accès refusé — Admin uniquement.",
        },
        {
          status: 403,
        },
      );
    }

    const { id } = await params;

    const body = await request.json();

    const role = body.role as Role;

    if (!TOUS_LES_ROLES.includes(role)) {
      return NextResponse.json(
        {
          erreur: "Rôle invalide.",
        },
        {
          status: 400,
        },
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id,
      },
      include: {
        roles: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          erreur: "Utilisateur introuvable.",
        },
        {
          status: 404,
        },
      );
    }

    if (user.roles.length === 1) {
      return NextResponse.json(
        {
          erreur: "Impossible de retirer le dernier rôle.",
        },
        {
          status: 400,
        },
      );
    }

    await prisma.userRole.deleteMany({
      where: {
        userId: id,
        role,
      },
    });

    const userMisAJour = await prisma.user.findUnique({
      where: {
        id,
      },
      include: {
        roles: true,
      },
    });

    return NextResponse.json({
      message: `Rôle ${role} retiré.`,
      user: {
        id: userMisAJour?.id,
        email: userMisAJour?.email,
        roles: userMisAJour?.roles.map((r) => r.role),
      },
    });
  } catch (error) {
    console.error("Erreur retrait rôle :", error);

    return NextResponse.json(
      {
        erreur: "Erreur serveur.",
      },
      {
        status: 500,
      },
    );
  }
}