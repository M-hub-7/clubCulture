"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/lib/auth";
import { Loader } from "@/components/ui";
import type { Role } from "@/types";

interface GuardProps {
  /** Rôles autorisés (au moins un). Sans `roles`, il suffit d'être connecté. */
  roles?: Role[];
  children: ReactNode;
}

/** Redirige vers /connexion si non connecté ; affiche un refus si le rôle manque. */
export default function Guard({ roles, children }: GuardProps) {
  const { user, ready, has } = useAuth();
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    if (ready && !user)
      router.replace("/connexion?next=" + encodeURIComponent(path));
  }, [ready, user, path, router]);

  if (!ready || !user) return <Loader />;

  if (roles && !roles.some(has)) {
    return (
      <p className="p-16 text-center text-on-surface-muted">
        Accès réservé au rôle : {roles.join(" / ")}.
      </p>
    );
  }
  return <>{children}</>;
}
