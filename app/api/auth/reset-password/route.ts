import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";

import { prisma } from "@/app/lib/prisma";
import { validerMotDePasse } from "@/app/lib/password";

function hasherToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const token = typeof body.token === "string" ? body.token.trim() : "";

    const password = typeof body.password === "string" ? body.password : "";

    if (!token) {
      return NextResponse.json(
        {
          erreur: "Le token de réinitialisation est obligatoire.",
        },
        { status: 400 },
      );
    }

    if (!password) {
      return NextResponse.json(
        {
          erreur: "Le nouveau mot de passe est obligatoire.",
        },
        { status: 400 },
      );
    }

    const tokenHash = hasherToken(token);

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: {
        tokenHash,
      },
      include: {
        user: {
          select: {
            id: true,
            nom: true,
            email: true,
            passwordHash: true,
          },
        },
      },
    });

    if (!resetToken) {
      return NextResponse.json(
        {
          erreur:
            "Ce lien de réinitialisation est invalide ou a déjà été utilisé.",
        },
        { status: 400 },
      );
    }

    if (resetToken.expiresAt.getTime() < Date.now()) {
      await prisma.passwordResetToken.delete({
        where: {
          id: resetToken.id,
        },
      });

      return NextResponse.json(
        {
          erreur:
            "Ce lien de réinitialisation a expiré. Veuillez recommencer la procédure.",
        },
        { status: 400 },
      );
    }

    const validation = validerMotDePasse(
      password,
      resetToken.user.nom,
      resetToken.user.email,
    );

    if (!validation.valide) {
      return NextResponse.json(
        {
          erreur: validation.erreur,
        },
        { status: 400 },
      );
    }

    /*
     * Si un ancien mot de passe existe,
     * on interdit de réutiliser exactement le même.
     */
    if (resetToken.user.passwordHash) {
      const ancienMotDePasseIdentique = await bcrypt.compare(
        password,
        resetToken.user.passwordHash,
      );

      if (ancienMotDePasseIdentique) {
        return NextResponse.json(
          {
            erreur: "Le nouveau mot de passe doit être différent de l'ancien.",
          },
          { status: 400 },
        );
      }
    }

    const nouveauPasswordHash = await bcrypt.hash(password, 12);

    /*
     * Transaction :
     * 1. modification du mot de passe
     * 2. suppression du token
     */
    await prisma.$transaction([
      prisma.user.update({
        where: {
          id: resetToken.user.id,
        },
        data: {
          passwordHash: nouveauPasswordHash,
        },
      }),

      prisma.passwordResetToken.delete({
        where: {
          id: resetToken.id,
        },
      }),

      /*
       * Si plusieurs tokens existaient éventuellement,
       * on les supprime également.
       */
      prisma.passwordResetToken.deleteMany({
        where: {
          userId: resetToken.user.id,
        },
      }),
    ]);

    return NextResponse.json(
      {
        message: "Votre mot de passe a été réinitialisé avec succès.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erreur réinitialisation mot de passe :", error);

    return NextResponse.json(
      {
        erreur: "Une erreur est survenue lors de la réinitialisation.",
      },
      { status: 500 },
    );
  }
}
