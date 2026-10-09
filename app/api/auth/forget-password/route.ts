import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";

import { prisma } from "@/app/lib/prisma";
import { envoyerEmailReinitialisation } from "@/app/lib/emailPassword";

const DUREE_TOKEN_MINUTES = 30;

function hasherToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(request: NextRequest) {
  console.log("🔵 POST /forget-password");

  try {
    const body = await request.json();

    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email) {
      return NextResponse.json(
        {
          erreur: "L'adresse email est obligatoire.",
        },
        { status: 400 },
      );
    }

    const emailValide = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!emailValide) {
      return NextResponse.json(
        {
          erreur: "Veuillez saisir une adresse email valide.",
        },
        { status: 400 },
      );
    }

    console.log("🔎 Recherche du compte :", email);

    /*
     * Vérification de l'existence du compte.
     */
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        email: true,
        nom: true,
      },
    });

    /*
     * Aucun compte trouvé.
     */
    if (!user) {
      console.log("❌ Aucun compte trouvé :", email);

      return NextResponse.json(
        {
          erreur:
            "Aucun compte Club Culture n'est associé à cette adresse email. Veuillez vous inscrire.",
          inscription: true,
        },
        { status: 404 },
      );
    }

    console.log("✅ Compte trouvé :", {
      id: user.id,
      email: user.email,
    });

    /*
     * Suppression des anciens tokens.
     */
    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
      },
    });

    /*
     * Génération d'un token sécurisé.
     */
    const token = randomBytes(32).toString("hex");

    /*
     * Hash du token avant stockage.
     */
    const tokenHash = hasherToken(token);

    const expiresAt = new Date(Date.now() + DUREE_TOKEN_MINUTES * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt,
      },
    });

    /*
     * URL de l'application.
     */
    const baseUrl =
      process.env.APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const resetUrl =
      `${baseUrl}/reinitialiser-mot-de-passe?token=` +
      encodeURIComponent(token);

    console.log("🔐 Token de réinitialisation créé");
    console.log("📍 URL :", resetUrl);

    /*
     * Envoi de l'email via Resend.
     */
    try {
      console.log("📧 Appel de emailPassword.ts...");

      await envoyerEmailReinitialisation({
        email: user.email,
        nom: user.nom,
        resetUrl,
      });

      console.log("✅ Email de réinitialisation envoyé");
    } catch (emailError) {
      console.error("❌ Erreur Resend :", emailError);

      /*
       * Suppression du token inutilisable.
       */
      await prisma.passwordResetToken.deleteMany({
        where: {
          tokenHash,
        },
      });

      return NextResponse.json(
        {
          erreur:
            "Le compte existe, mais nous n'avons pas pu envoyer l'email de réinitialisation. Veuillez réessayer.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        message:
          "Un lien de réinitialisation a été envoyé à votre adresse email. Vérifiez votre boîte de réception et vos courriers indésirables.",
        inscription: false,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("❌ Erreur mot de passe oublié :", error);

    return NextResponse.json(
      {
        erreur: "Une erreur est survenue. Veuillez réessayer plus tard.",
      },
      { status: 500 },
    );
  }
}
