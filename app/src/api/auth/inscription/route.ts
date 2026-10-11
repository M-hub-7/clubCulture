import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/app/lib/prisma";

// Rôles que l'utilisateur peut choisir à l'inscription
const ROLES_INSCRIPTION = ["ACHETEUR", "PROMOTEUR", "PRESTATAIRE"];

export async function POST(request: Request) {
  try {
    const { email, nom, password, role } = await request.json();

    // Validation des champs
    if (!email || !nom || !password || !role) {
      return NextResponse.json(
        {
          erreur:
            "Tous les champs sont obligatoires (email, nom, password, role)",
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

    // Vérifier que le rôle est autorisé à l'inscription
    if (!ROLES_INSCRIPTION.includes(role)) {
      return NextResponse.json(
        {
          erreur: `Rôle invalide. Choisissez parmi : ${ROLES_INSCRIPTION.join(", ")}`,
          rolesDisponibles: ROLES_INSCRIPTION,
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

    // Créer le compte avec le rôle choisi
    const user = await prisma.user.create({
      data: {
        email,
        nom,
        passwordHash,
        roles: {
          create: [{ role }],
        },
      },
      include: { roles: true },
    });

    // Message de redirection selon le rôle
    const redirections: Record<string, string> = {
      ACHETEUR: "/evenements",
      PROMOTEUR: "/promoteur/dashboard",
      PRESTATAIRE: "/prestataire/dashboard",
    };

    return NextResponse.json(
      {
        message: `Compte ${role} créé avec succès`,
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
