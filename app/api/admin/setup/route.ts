import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createHash, timingSafeEqual } from "crypto";
import { prisma } from "@/app/lib/prisma";

/** Comparaison à temps constant (hash pour égaliser les longueurs). */
function secretsEgaux(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export async function POST(request: Request) {
  try {
    // Vérifier la clé secrète admin
    const adminSecret = request.headers.get("x-admin-secret");
    const expectedSecret = process.env.ADMIN_SECRET;

    if (!expectedSecret || !secretsEgaux(adminSecret ?? "", expectedSecret)) {
      return NextResponse.json(
        { erreur: "Clé secrète invalide" },
        { status: 403 },
      );
    }

    const { email, nom, password } = await request.json();

    if (!email || !nom || !password) {
      return NextResponse.json(
        { erreur: "email, nom et password sont obligatoires" },
        { status: 400 },
      );
    }

    // Vérifier si admin déjà créé
    const adminExistant = await prisma.userRole.findFirst({
      where: { role: "ADMIN" },
    });

    if (adminExistant) {
      return NextResponse.json(
        { erreur: "Un administrateur existe déjà" },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Créer l'admin avec tous les droits
    const admin = await prisma.user.create({
      data: {
        email,
        nom,
        passwordHash,
        emailVerifie: true,
        roles: {
          create: [{ role: "ADMIN" }],
        },
      },
      include: { roles: true },
    });

    return NextResponse.json(
      {
        message: "Administrateur créé avec succès",
        admin: {
          id: admin.id,
          email: admin.email,
          nom: admin.nom,
          roles: admin.roles.map((r) => r.role),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erreur création admin:", error);
    return NextResponse.json({ erreur: "Erreur serveur" }, { status: 500 });
  }
}
