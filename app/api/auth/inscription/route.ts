import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/app/lib/prisma";
import { validerMotDePasse } from "@/app/lib/password";

const ROLES_INSCRIPTION = ["ACHETEUR", "PROMOTEUR", "PRESTATAIRE"];

export async function POST(request: Request) {
  try {
    const { email, nom, password, role } = await request.json();

    // Nom
    if (!nom?.trim()) {
      return NextResponse.json(
        {
          erreur: "Veuillez renseigner votre nom.",
          champ: "nom",
        },
        { status: 400 },
      );
    }

    // Email
    if (!email?.trim()) {
      return NextResponse.json(
        {
          erreur: "Veuillez renseigner votre adresse email.",
          champ: "email",
        },
        { status: 400 },
      );
    }

    const emailNormalise = email.trim().toLowerCase();

    const emailValide = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalise);

    if (!emailValide) {
      return NextResponse.json(
        {
          erreur: "Veuillez saisir une adresse email valide.",
          champ: "email",
        },
        { status: 400 },
      );
    }

    // Mot de passe
    if (!password) {
      return NextResponse.json(
        {
          erreur: "Veuillez renseigner votre mot de passe.",
          champ: "password",
        },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          erreur: "Le mot de passe doit contenir au moins 8 caractères.",
          champ: "password",
        },
        { status: 400 },
      );
    }

    // Rôle
    if (!role) {
      return NextResponse.json(
        {
          erreur: "Veuillez sélectionner un type de compte.",
          champ: "role",
        },
        { status: 400 },
      );
    }

    if (!ROLES_INSCRIPTION.includes(role)) {
      return NextResponse.json(
        {
          erreur: "Le type de compte sélectionné n'est pas valide.",
          champ: "role",
          rolesDisponibles: ROLES_INSCRIPTION,
        },
        { status: 400 },
      );
    }

    // Email déjà utilisé
    const existant = await prisma.user.findUnique({
      where: {
        email: emailNormalise,
      },
    });

    if (existant) {
      return NextResponse.json(
        {
          erreur:
            "Cette adresse email est déjà utilisée. Connectez-vous ou utilisez une autre adresse.",
          champ: "email",
        },
        { status: 409 },
      );
    }

    const validationMotDePasse = validerMotDePasse(password, nom, email);

    if (!validationMotDePasse.valide) {
      return NextResponse.json(
        {
          erreur: validationMotDePasse.erreur,
        },
        {
          status: 400,
        },
      );
    }

    // Hash du mot de passe
    const passwordHash = await bcrypt.hash(password, 12);

    // Création du compte
    const user = await prisma.user.create({
      data: {
        email: emailNormalise,
        nom: nom.trim(),
        passwordHash,
        roles: {
          create: [{ role }],
        },
      },
      include: {
        roles: true,
      },
    });

    return NextResponse.json(
      {
        message:
          "Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter.",
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

    return NextResponse.json(
      {
        erreur:
          "Une erreur technique est survenue. Veuillez réessayer dans quelques instants.",
      },
      { status: 500 },
    );
  }
}
