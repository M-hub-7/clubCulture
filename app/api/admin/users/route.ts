import { NextResponse } from "next/server";
import { verifierRoleUser } from "@/app/lib/getUser";
import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcryptjs";

const ROLES_VALIDES = [
  "ACHETEUR",
  "PROMOTEUR",
  "AGENT",
  "PRESTATAIRE",
  "ADMIN",
];

// GET — Liste tous les utilisateurs
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
    const role = searchParams.get("role");
    const recherche = searchParams.get("q");

    const users = await prisma.user.findMany({
      where: {
        ...(role && {
          roles: { some: { role: role as any } },
        }),
        ...(recherche && {
          OR: [
            { nom: { contains: recherche, mode: "insensitive" } },
            { email: { contains: recherche, mode: "insensitive" } },
          ],
        }),
      },
      include: {
        roles: true,
        _count: {
          select: {
            evenements: true,
            commandes: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      users.map((u) => ({
        id: u.id,
        email: u.email,
        nom: u.nom,
        roles: u.roles.map((r) => r.role),
        createdAt: u.createdAt,
        stats: {
          evenements: u._count.evenements,
          commandes: u._count.commandes,
        },
      })),
    );
  } catch (error) {
    console.error("Erreur GET admin/users:", error);
    return NextResponse.json({ erreur: "Erreur serveur" }, { status: 500 });
  }
}

// POST — Admin crée un utilisateur avec les rôles qu'il veut
export async function POST(request: Request) {
  try {
    const session = await verifierRoleUser(request, "ADMIN");
    if (!session) {
      return NextResponse.json(
        { erreur: "Accès refusé — Admin uniquement" },
        { status: 403 },
      );
    }

    const { email, nom, password, roles } = await request.json();

    // Validation
    if (!email || !nom || !password) {
      return NextResponse.json(
        { erreur: "email, nom et password sont obligatoires" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { erreur: "Le mot de passe doit faire au moins 8 caractères" },
        { status: 400 },
      );
    }

    // Valider les rôles
    const rolesACreer = roles && roles.length > 0 ? roles : ["ACHETEUR"];
    const roleInvalide = rolesACreer.find(
      (r: string) => !ROLES_VALIDES.includes(r),
    );
    if (roleInvalide) {
      return NextResponse.json(
        {
          erreur: `Rôle invalide : ${roleInvalide}`,
          rolesAcceptes: ROLES_VALIDES,
        },
        { status: 400 },
      );
    }

    // Vérifier si email déjà utilisé
    const existant = await prisma.user.findUnique({ where: { email } });
    if (existant) {
      return NextResponse.json(
        { erreur: "Cet email est déjà utilisé" },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        nom,
        passwordHash,
        emailVerifie: true, // Admin crée des comptes vérifiés
        roles: {
          create: rolesACreer.map((role: string) => ({ role })),
        },
      },
      include: { roles: true },
    });

    return NextResponse.json(
      {
        message: "Utilisateur créé avec succès",
        user: {
          id: user.id,
          email: user.email,
          nom: user.nom,
          roles: user.roles.map((r) => r.role),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erreur POST admin/users:", error);
    return NextResponse.json({ erreur: "Erreur serveur" }, { status: 500 });
  }
}
