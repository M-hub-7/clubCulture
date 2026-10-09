import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { prisma } from "@/app/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();

    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json(
        {
          erreur: "Email et mot de passe obligatoires.",
        },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
      include: {
        roles: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          erreur: "Email ou mot de passe incorrect.",
          champ: "email",
        },
        { status: 401 },
      );
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        {
          erreur: "Ce compte ne possède pas de mot de passe valide.",
        },
        { status: 401 },
      );
    }

    const passwordValide = await bcrypt.compare(password, user.passwordHash);

    if (!passwordValide) {
      return NextResponse.json(
        {
          erreur: "Email ou mot de passe incorrect.",
          champ: "password",
        },
        { status: 401 },
      );
    }

    const roles = user.roles.map((role) => role.role);

    const secretValue = process.env.NEXTAUTH_SECRET;

    if (!secretValue) {
      console.error("❌ NEXTAUTH_SECRET est absente");

      return NextResponse.json(
        {
          erreur: "Configuration serveur incorrecte.",
        },
        { status: 500 },
      );
    }

    const secret = new TextEncoder().encode(secretValue);

    const token = await new SignJWT({
      id: user.id,
      email: user.email,
      nom: user.nom,
      roles,
    })
      .setProtectedHeader({
        alg: "HS256",
      })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);

    return NextResponse.json({
      message: "Connexion réussie.",
      token,
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        roles,
      },
    });
  } catch (error) {
    console.error("❌ ERREUR CONNEXION :", error);

    return NextResponse.json(
      {
        erreur: "Une erreur interne est survenue.",
      },
      { status: 500 },
    );
  }
}
