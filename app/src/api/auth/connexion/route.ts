import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/app/lib/prisma";
import { SignJWT } from "jose";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { erreur: "Email et mot de passe requis" },
        { status: 400 },
      );
    }

    // Chercher l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email },
      include: { roles: true },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { erreur: "Email ou mot de passe incorrect" },
        { status: 401 },
      );
    }

    // Vérifier le mot de passe
    const valide = await bcrypt.compare(password, user.passwordHash);
    if (!valide) {
      return NextResponse.json(
        { erreur: "Email ou mot de passe incorrect" },
        { status: 401 },
      );
    }

    // Générer un JWT
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
    const token = await new SignJWT({
      id: user.id,
      email: user.email,
      nom: user.nom,
      roles: user.roles.map((r) => r.role),
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(secret);

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        roles: user.roles.map((r) => r.role),
      },
    });
  } catch (error) {
    console.error("Erreur connexion:", error);
    return NextResponse.json({ erreur: "Erreur serveur" }, { status: 500 });
  }
}
