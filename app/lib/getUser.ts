import { prisma } from "@/app/lib/prisma";
import { jwtVerify } from "jose";

export async function getUser(request: Request) {
  try {
    // ============================================================
    // 1. RÉCUPÉRER LE TOKEN
    // ============================================================

    const authHeader = request.headers.get("Authorization");

    console.log("🔐 Authorization :", authHeader ? "présente" : "absente");

    if (!authHeader?.startsWith("Bearer ")) {
      console.log("❌ Aucun Bearer token");
      return null;
    }

    const token = authHeader.substring(7);

    if (!token) {
      console.log("❌ Token vide");
      return null;
    }

    // ============================================================
    // 2. VÉRIFIER LE JWT
    // ============================================================

    const secretValue = process.env.NEXTAUTH_SECRET;

    if (!secretValue) {
      console.error("❌ NEXTAUTH_SECRET est manquante");
      return null;
    }

    const secret = new TextEncoder().encode(secretValue);

    const { payload } = await jwtVerify(token, secret);

    console.log("✅ JWT valide");
    console.log("📦 Payload JWT :", payload);

    // ============================================================
    // 3. RÉCUPÉRER L'ID UTILISATEUR
    // ============================================================

    const userId = typeof payload.id === "string" ? payload.id : null;

    if (!userId) {
      console.log("❌ Aucun ID utilisateur dans le JWT");
      return null;
    }

    // ============================================================
    // 4. RÉCUPÉRER L'UTILISATEUR ET SES VRAIS RÔLES EN BASE
    // ============================================================

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        roles: true,
      },
    });

    if (!user) {
      console.log("❌ Utilisateur introuvable en base :", userId);
      return null;
    }

    const roles = user.roles.map((role) => role.role);

    console.log("👤 Utilisateur :", {
      id: user.id,
      email: user.email,
      nom: user.nom,
      roles,
    });

    // ============================================================
    // 5. RETOURNER LA SESSION
    // ============================================================

    return {
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        roles,
      },
    };
  } catch (error) {
    console.error("❌ Erreur getUser :", error);
    return null;
  }
}

export async function verifierRoleUser(request: Request, role: string) {
  const session = await getUser(request);

  if (!session) {
    console.log("❌ Aucune session valide");
    return null;
  }

  const roles = session.user.roles;

  console.log("🔑 Rôles de l'utilisateur :", roles);
  console.log("🎯 Rôle demandé :", role);

  // ADMIN possède tous les droits
  if (roles.includes("ADMIN")) {
    console.log("✅ Accès ADMIN accordé");
    return session;
  }

  // Vérification du rôle demandé
  if (roles.includes(role)) {
    console.log(`✅ Accès ${role} accordé`);
    return session;
  }

  console.log(`❌ Accès ${role} refusé`);
  return null;
}
