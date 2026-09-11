import { prisma } from "@/app/lib/prisma";
import { jwtVerify } from "jose";

export async function getUser(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;

    const token = authHeader.split(" ")[1];
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);

    const { payload } = await jwtVerify(token, secret);

    return {
      user: {
        id: payload.id as string,
        email: payload.email as string,
        nom: payload.nom as string,
        roles: payload.roles as string[],
      },
    };
  } catch {
    return null;
  }
}

export async function verifierRoleUser(request: Request, role: string) {
  const session = await getUser(request);
  if (!session) return null;

  // Admin a accès à tout
  if (session.user.roles.includes("ADMIN")) return session;

  return session.user.roles.includes(role) ? session : null;
}
