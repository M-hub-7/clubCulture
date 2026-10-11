import type { ReactNode } from "react";
import DashboardShell, { type NavItem } from "@/components/layout/DashboardShell";

const ITEMS: NavItem[] = [
  ["/promoteur/dashboard", "dashboard", "Tableau de bord"],
  ["/promoteur/evenements/nouveau", "add_circle", "Créer un événement"],
  ["/profil", "settings", "Paramètres"],
];

export default function PromoteurLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell roles={["PROMOTEUR"]} items={ITEMS}>
      {children}
    </DashboardShell>
  );
}
