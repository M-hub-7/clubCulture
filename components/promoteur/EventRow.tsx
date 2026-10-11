import Link from "next/link";
import { Badge, Bar } from "@/components/ui";
import { dt, eurCents } from "@/app/lib/format";
import type { EvenementPromoteur } from "@/types";

export default function EventRow({ e }: { e: EvenementPromoteur }) {
  return (
    <Link
      href={`/promoteur/evenements/${e.id}`}
      className="card block transition hover:border-accent-amber/50"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase text-accent-amber">
            {dt(e.dateDebut)}
          </p>
          <h3 className="font-head text-lg font-bold">{e.titre}</h3>
          <p className="text-sm text-on-surface-muted">
            {e.lieu}, {e.ville}
          </p>
        </div>
        <div className="text-right">
          <Badge s={e.statut} />
          <p className="mt-2 font-bold text-secondary">
            {eurCents(e.stats.totalRecettes)}
          </p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3 text-sm">
        <span>
          {e.stats.placesVendues}/{e.stats.placesTotal}
        </span>
        <Bar v={e.stats.placesVendues} max={e.stats.placesTotal} />
      </div>
    </Link>
  );
}
