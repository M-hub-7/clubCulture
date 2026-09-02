import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Routes protégées
  const routesProtegees = ["/promoteur", "/admin", "/mon-compte"];

  const estProtegee = routesProtegees.some((r) => pathname.startsWith(r));

  if (estProtegee && !session) {
    return NextResponse.redirect(new URL("/connexion", req.url));
  }

  // Route admin — vérifier le rôle
  if (pathname.startsWith("/admin")) {
    const roles = (session?.user as any)?.roles || [];
    if (!roles.includes("ADMIN")) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
