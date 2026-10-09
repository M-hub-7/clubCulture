import { StatCard } from "@/components/ui";
import { eurCents } from "@/app/lib/format";
import type { EvenementPromoteur } from "@/types";

type StatKey = keyof EvenementPromoteur["stats"];

export default function KpiGrid({ events }: { events: EvenementPromoteur[] }) {
  const sum = (key: StatKey) =>
    events.reduce((acc, e) => acc + e.stats[key], 0);
  const places = sum("placesTotal");
  const vendues = sum("placesVendues");

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Billets vendus" value={vendues} />
      <StatCard label="Recettes" value={eurCents(sum("totalRecettes"))} />
      <StatCard
        label="Taux de remplissage"
        value={`${places ? Math.round((vendues / places) * 100) : 0} %`}
      />
      <StatCard
        label="Événements publiés"
        value={events.filter((e) => e.statut === "PUBLIE").length}
      />
    </div>
  );
}
