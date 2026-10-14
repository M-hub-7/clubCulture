import { prisma } from "@/app/lib/prisma";
import { jwtVerify } from "jose";
import type { Role } from "@/app/generated/prisma/enums";

/**
 * Lit le Bearer token, vérifie le JWT (NEXTAUTH_SECRET) et relit
 * l'utilisateur et ses rôles en base. Ne journalise ni le jeton ni le payload.
 */
export async function getUser(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7).trim();

    if (!token) {
      return null;
    }

    const secretValue = process.env.NEXTAUTH_SECRET;

    if (!secretValue) {
      console.error("NEXTAUTH_SECRET est manquante");
      return null;
    }

    const secret = new TextEncoder().encode(secretValue);

    const { payload } = await jwtVerify(token, secret);

    const userId = typeof payload.id === "string" ? payload.id : null;

    if (!userId) {
      return null;
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
      return null;
    }

    const roles = user.roles.map((role) => role.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        roles,
      },
    };
  } catch {
    // Jeton expiré ou signature invalide
    return null;
  }
}

/** Renvoie la session si l'utilisateur a le rôle demandé (ADMIN a tous les droits). */
export async function verifierRoleUser(request: Request, role: Role) {
  const session = await getUser(request);

  if (!session) {
    return null;
  }

  const roles = session.user.roles;

  if (roles.includes("ADMIN") || roles.includes(role)) {
    return session;
  }

  return null;
}
