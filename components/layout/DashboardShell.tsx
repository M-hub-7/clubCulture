"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import Guard from "./Guard";
import { Icon } from "@/components/ui";
import type { Role } from "@/types";

/** [href, icône Material, libellé] */
export type NavItem = [href: string, icon: string, label: string];

interface DashboardShellProps {
  roles: Role[];
  items: NavItem[];
  children: ReactNode;
}

/** Coquille commune aux espaces Promoteur et Admin : menu latéral + contenu. */
export default function DashboardShell({ roles, items, children }: DashboardShellProps) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || (href.split("/").length > 2 && pathname.startsWith(href));

  return (
    <Guard roles={roles}>
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-8 md:flex-row">
        <nav className="flex gap-2 overflow-x-auto md:w-56 md:flex-col">
          {items.map(([href, icon, label]) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-semibold ${
                isActive(href)
                  ? "bg-accent-green text-white"
                  : "text-on-surface-muted hover:bg-surface-card"
              }`}
            >
              <Icon n={icon} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </Guard>
  );
}
