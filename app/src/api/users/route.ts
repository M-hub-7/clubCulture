import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/app/lib/prisma";
import { getUser } from "@/app/lib/getUser";

const ROLES_INSCRIPTION = ["ACHETEUR", "PROMOTEUR", "PRESTATAIRE"] as const;
type RoleInscription = (typeof ROLES_INSCRIPTION)[number];

// ─── POST — Inscription ──────────────────────────────────────
export async function POST(request: Request) {
  try {
    const { email, nom, password, role } = await request.json();

    if (!email || !nom || !password || !role) {
      return NextResponse.json(
        { erreur: "Les champs email, nom, password et role sont obligatoires" },
        { status: 400 },
      );
    }

    if (!ROLES_INSCRIPTION.includes(role as RoleInscription)) {
      return NextResponse.json(
        {
          erreur:
            "Rôle invalide. Les rôles autorisés sont : ACHETEUR, PROMOTEUR, PRESTATAIRE",
        },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { erreur: "Le mot de passe doit faire au moins 8 caractères" },
        { status: 400 },
      );
    }

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
        roles: {
          create: { role: role as RoleInscription },
        },
      },
      include: { roles: true },
    });

    // Redirection selon le rôle
    const redirections: Record<string, string> = {
      ACHETEUR: "/evenements",
      PROMOTEUR: "/promoteur/dashboard",
      PRESTATAIRE: "/prestataire/dashboard",
    };

    return NextResponse.json(
      {
        message: "Compte créé avec succès",
        redirection: redirections[role],
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
    console.error("Erreur inscription:", error);
    return NextResponse.json({ erreur: "Erreur serveur" }, { status: 500 });
  }
}

// ─── GET — Mon profil ────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const session = await getUser(request);
    if (!session) {
      return NextResponse.json({ erreur: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        roles: true,
        commandes: {
          include: {
            evenement: {
              select: {
                id: true,
                titre: true,
                lieu: true,
                dateDebut: true,
              },
            },
            billets: {
              select: {
                id: true,
                numero: true,
                token: true,
                statut: true,
                nomPorteur: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        evenements: {
          select: {
            id: true,
            titre: true,
            statut: true,
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        _count: {
          select: {
            commandes: true,
            evenements: true,
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
      commandes: user.commandes,
      evenements: user.evenements,
      stats: {
        totalCommandes: user._count.commandes,
        totalEvenements: user._count.evenements,
      },
    });
  } catch (error) {
    console.error("Erreur GET users:", error);
    return NextResponse.json({ erreur: "Erreur serveur" }, { status: 500 });
  }
}

// ─── PUT — Modifier mon profil ───────────────────────────────
export async function PUT(request: Request) {
  try {
    const session = await getUser(request);
    if (!session) {
      return NextResponse.json({ erreur: "Non authentifié" }, { status: 401 });
    }

    const { nom } = await request.json();

    if (!nom || nom.trim().length === 0) {
      return NextResponse.json(
        { erreur: "Le nom est obligatoire" },
        { status: 400 },
      );
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { nom: nom.trim() },
      include: { roles: true },
    });

    return NextResponse.json({
      message: "Profil mis à jour",
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        roles: user.roles.map((r) => r.role),
      },
    });
  } catch (error) {
    console.error("Erreur PUT users:", error);
    return NextResponse.json({ erreur: "Erreur serveur" }, { status: 500 });
  }
}
