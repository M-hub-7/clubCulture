import { StatCard } from "@/components/ui";
import type { TicketStatsData } from "@/types";

const LABELS: Record<keyof TicketStatsData, string> = {
  total: "Total",
  valides: "Valides",
  utilises: "Utilisés",
  annules: "Annulés",
  rembourses: "Remboursés",
};

export default function TicketStats({ stats }: { stats: TicketStatsData }) {
  return (
    <div className="grid gap-4 sm:grid-cols-5">
      {(Object.keys(LABELS) as (keyof TicketStatsData)[]).map((key) => (
        <StatCard key={key} label={LABELS[key]} value={stats[key]} />
      ))}
    </div>
  );
}
