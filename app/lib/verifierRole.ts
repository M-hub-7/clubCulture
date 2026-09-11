import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { jwtVerify } from "jose";
import { headers } from "next/headers";

type Role = "ACHETEUR" | "PROMOTEUR" | "AGENT" | "PRESTATAIRE" | "ADMIN";

async function getUserFromBearerToken() {
  try {
    const requestHeaders = await headers();

    const authorization = requestHeaders.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return null;
    }

    const token = authorization.substring(7);

    const secret = process.env.NEXTAUTH_SECRET;

    if (!secret) {
      console.error("NEXTAUTH_SECRET n'est pas défini");
      return null;
    }

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
    );

    if (!payload.id) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: {
        id: payload.id as string,
      },
      include: {
        roles: true,
      },
    });

    return user;
  } catch (error) {
    console.error("Erreur vérification Bearer JWT:", error);
    return null;
  }
}

export async function verifierRole(role: Role) {
  /*
   * 1. On essaie d'abord le JWT Bearer utilisé
   *    par notre API de connexion.
   */
  const bearerUser = await getUserFromBearerToken();

  if (bearerUser) {
    const estAdmin = bearerUser.roles.some((r) => r.role === "ADMIN");

    if (estAdmin) {
      return bearerUser;
    }

    const aLeRole = bearerUser.roles.some((r) => r.role === role);

    return aLeRole ? bearerUser : null;
  }

  /*
   * 2. Si aucun Bearer JWT n'est présent,
   *    on conserve le fonctionnement Auth.js.
   */
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    include: {
      roles: true,
    },
  });

  if (!user) {
    return null;
  }

  // Admin a accès à tout
  const estAdmin = user.roles.some((r) => r.role === "ADMIN");

  if (estAdmin) {
    return user;
  }

  const aLeRole = user.roles.some((r) => r.role === role);

  return aLeRole ? user : null;
}

export async function getSessionUser() {
  /*
   * Vérifier d'abord le Bearer JWT
   */
  const bearerUser = await getUserFromBearerToken();

  if (bearerUser) {
    return bearerUser;
  }

  /*
   * Sinon utiliser Auth.js
   */
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  return prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    include: {
      roles: true,
    },
  });
}
