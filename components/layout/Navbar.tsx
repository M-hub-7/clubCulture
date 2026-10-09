"use client";

import Link from "next/link";
import { useAuth } from "@/app/lib/auth";
import UserMenu from "./UserMenu";
import Brand from "./Brand";
import type { Role } from "@/types";

const ROLE_LINKS: [Role, string, string][] = [
  ["ACHETEUR", "/mes-billets", "Mes billets"],
  ["PROMOTEUR", "/promoteur/dashboard", "Espace promoteur"],
  ["AGENT", "/agent/scan", "Scanner"],
  ["PRESTATAIRE", "/prestataire", "Espace prestataire"],
  ["ADMIN", "/admin", "Administration"],
];

const linkClass =
  "text-xs font-semibold uppercase tracking-wider text-white/55 transition hover:text-accent-amber";

export default function Navbar() {
  const { has } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#090d2d]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center gap-5 px-5 py-3">
        <Brand />
        <nav className="hidden flex-1 items-center gap-5 md:flex">
          <Link href="/evenements" className={linkClass}>
            Événements
          </Link>
          {ROLE_LINKS.filter(([role]) => has(role)).map(([, href, label]) => (
            <Link key={href} href={href} className={linkClass}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
