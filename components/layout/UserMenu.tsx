"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/lib/auth";
import { Icon } from "@/components/ui";

export default function UserMenu() {
  const { user, has, logout } = useAuth();
  const router = useRouter();

  if (!user) {
    return (
      <div className="flex gap-2">
        <Link href="/connexion" className="btn-ghost !px-4 !py-2">
          Connexion
        </Link>
        <Link href="/inscription" className="btn !px-4 !py-2">
          S&apos;inscrire
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {has("PROMOTEUR") && (
        <Link
          href="/promoteur/evenements/nouveau"
          className="hidden btn sm:inline-flex !px-4 !py-2"
        >
          Créer un événement
        </Link>
      )}
      <Link
        href={has("ADMIN") ? "/admin" : "/profil"}
        title={user.nom ?? user.email}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[#151a3d] hover:border-accent-amber/50"
      >
        <Icon n="person" />
      </Link>
      <button
        onClick={() => {
          logout();
          router.push("/");
        }}
        title="Déconnexion"
        className="text-white/55 transition hover:text-red-300"
      >
        <Icon n="logout" />
      </button>
    </div>
  );
}
