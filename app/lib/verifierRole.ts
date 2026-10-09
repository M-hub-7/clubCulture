import { jwtVerify } from "jose";
import { headers } from "next/headers";
import { prisma } from "@/app/lib/prisma";

type Role =
  | "ACHETEUR"
  | "PROMOTEUR"
  | "AGENT"
  | "PRESTATAIRE"
  | "ADMIN";

async function getUserFromBearerToken() {
  try {
    const requestHeaders = await headers();

    const authorization = requestHeaders.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return null;
    }

    const token = authorization.substring(7).trim();

    if (!token) {
      return null;
    }

    const secretValue = process.env.NEXTAUTH_SECRET;

    if (!secretValue) {
      console.error("NEXTAUTH_SECRET n'est pas défini.");
      return null;
    }

    const secret = new TextEncoder().encode(secretValue);

    const { payload } = await jwtVerify(token, secret);

    if (typeof payload.id !== "string" || !payload.id) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: {
        id: payload.id,
      },
      include: {
        roles: true,
      },
    });

    return user;
  } catch (error) {
    console.error("Erreur vérification Bearer JWT :", error);
    return null;
  }
}

export async function verifierRole(role: Role) {
  const user = await getUserFromBearerToken();

  if (!user) {
    return null;
  }

  const roles = user.roles.map((r) => r.role);

  if (roles.includes("ADMIN")) {
    return user;
  }

  if (roles.includes(role)) {
    return user;
  }

  return null;
}

export async function getSessionUser() {
  return getUserFromBearerToken();
}