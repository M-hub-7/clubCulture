import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/app/lib/prisma";

interface TokenPayload {
  id?: string;
  email?: string;
  nom?: string | null;
  roles?: string[];
}

async function getUserIdFromRequest(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization) {
    return null;
  }

  const [type, token] = authorization.split(" ");

  if (type !== "Bearer" || !token) {
    return null;
  }

  if (!process.env.NEXTAUTH_SECRET) {
    throw new Error("NEXTAUTH_SECRET est manquant.");
  }

  try {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);

    const { payload } = await jwtVerify(token, secret);

    const data = payload as TokenPayload;

    return data.id ?? null;
  } catch (error) {
    console.error("Token invalide :", error);
    return null;
  }
}

/**
 * GET /api//auth/profil
 *
 * Récupère le profil de l'utilisateur connecté.
 *
 * Fonctionne pour :
 * ADMIN
 * AGENT
 * ACHETEUR
 * PROMOTEUR
 * PRESTATAIRE
 */
export async function GET(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json(
        {
          erreur: "Vous devez être connecté pour consulter votre profil.",
        },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
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
        { status: 404 },
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        nom: user.nom,
        email: user.email,
        roles: user.roles.map((role) => role.role),
        emailVerifie: user.emailVerifie,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Erreur récupération profil :", error);

    return NextResponse.json(
      {
        erreur:
          "Une erreur technique est survenue lors de la récupération du profil.",
      },
      { status: 500 },
    );
  }
}

/**
 * PUT /api//auth/profil
 *
 * Modification du profil de l'utilisateur connecté.
 *
 * Champs modifiables :
 * - nom
 * - email
 *
 * Les rôles ne peuvent PAS être modifiés ici.
 */
export async function PUT(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json(
        {
          erreur: "Vous devez être connecté pour modifier votre profil.",
        },
        { status: 401 },
      );
    }

    const body = await request.json();

    const { nom, email } = body;

    /*
     * Validation du nom
     */
    if (!nom?.trim()) {
      return NextResponse.json(
        {
          erreur: "Veuillez renseigner votre nom.",
          champ: "nom",
        },
        { status: 400 },
      );
    }

    /*
     * Validation de l'email
     */
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

    /*
     * Vérifier que l'email n'est pas déjà utilisé
     * par un autre utilisateur.
     */
    const emailExistant = await prisma.user.findFirst({
      where: {
        email: emailNormalise,
        NOT: {
          id: userId,
        },
      },
    });

    if (emailExistant) {
      return NextResponse.json(
        {
          erreur: "Cette adresse email est déjà utilisée par un autre compte.",
          champ: "email",
        },
        { status: 409 },
      );
    }

    /*
     * Mise à jour du profil
     */
    const user = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        nom: nom.trim(),
        email: emailNormalise,
      },
      include: {
        roles: true,
      },
    });

    return NextResponse.json({
      message: "Votre profil a été mis à jour avec succès.",
      user: {
        id: user.id,
        nom: user.nom,
        email: user.email,
        roles: user.roles.map((role) => role.role),
        emailVerifie: user.emailVerifie,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    // La contrainte unique en base protège aussi contre deux modifications simultanées.
    if (typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2002") {
      return NextResponse.json({ erreur: "Cette adresse email est déjà utilisée par un autre compte.", champ: "email" }, { status: 409 });
    }
    console.error("Erreur modification profil :", error);
    return NextResponse.json({ erreur: "Une erreur technique est survenue lors de la modification du profil." }, { status: 500 });
  }
}
