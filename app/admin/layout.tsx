import type { ReactNode } from "react";
import DashboardShell, { type NavItem } from "@/components/layout/DashboardShell";

const ITEMS: NavItem[] = [
  ["/admin", "dashboard", "Vue d'ensemble"],
  ["/admin/moderation", "gavel", "Modération"],
  ["/admin/utilisateurs", "group", "Utilisateurs & rôles"],
  ["/admin/billets", "confirmation_number", "Billets & remboursements"],
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell roles={["ADMIN"]} items={ITEMS}>
      {children}
    </DashboardShell>
  );
}
