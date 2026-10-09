import { StatCard } from "@/components/ui";
import { eur, totaux } from "@/app/lib/format";
import type { EvenementAdmin } from "@/types";

export default function AdminKpis({ events }: { events: EvenementAdmin[] }) {
  const t = totaux(events);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Événements" value={events.length} />
      <StatCard
        label="En attente"
        value={events.filter((e) => e.statut === "EN_MODERATION").length}
      />
      <StatCard label="Billets vendus" value={t.vendus} />
      <StatCard label="Volume de ventes" value={eur(t.recettes)} />
    </div>
  );
}
