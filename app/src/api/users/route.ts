import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/app/lib/prisma";

const ROLES_INSCRIPTION = ["ACHETEUR", "PROMOTEUR", "PRESTATAIRE"] as const;

type RoleInscription = (typeof ROLES_INSCRIPTION)[number];

export async function POST(request: Request) {
  try {
    const { email, nom, password, role } = await request.json();

    // Validation des champs
    if (!email || !nom || !password || !role) {
      return NextResponse.json(
        {
          erreur: "Les champs email, nom, password et role sont obligatoires",
        },
        { status: 400 },
      );
    }

    // Vérifier que le rôle est autorisé
    if (!ROLES_INSCRIPTION.includes(role as RoleInscription)) {
      return NextResponse.json(
        {
          erreur:
            "Rôle invalide. Les rôles autorisés sont : ACHETEUR, PROMOTEUR, PRESTATAIRE",
        },
        { status: 400 },
      );
    }

    // Vérifier la longueur du mot de passe
    if (password.length < 8) {
      return NextResponse.json(
        {
          erreur: "Le mot de passe doit faire au moins 8 caractères",
        },
        { status: 400 },
      );
    }

    // Vérifier si l'email existe déjà
    const existant = await prisma.user.findUnique({
      where: { email },
    });

    if (existant) {
      return NextResponse.json(
        { erreur: "Cet email est déjà utilisé" },
        { status: 409 },
      );
    }

    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(password, 12);

    // Créer l'utilisateur avec le rôle choisi
    const user = await prisma.user.create({
      data: {
        email,
        nom,
        passwordHash,
        roles: {
          create: {
            role: role as RoleInscription,
          },
        },
      },
      include: {
        roles: true,
      },
    });

    return NextResponse.json(
      {
        message: "Compte créé avec succès",
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
