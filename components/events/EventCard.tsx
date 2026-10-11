import Link from "next/link";
import { Icon } from "@/components/ui";
import { complet, dt, eur, minPrix } from "@/app/lib/format";
import type { Evenement } from "@/types";

export default function EventCard({ e }: { e: Evenement }) {
  const prix = minPrix(e);

  return (
    <Link
      href={`/evenements/${e.id}`}
      className="card group flex flex-col overflow-hidden !p-0 transition hover:-translate-y-1"
    >
      <div className="relative flex h-36 items-end bg-gradient-to-br from-accent-green/40 via-surface-card to-accent-amber/40 p-3">
        {complet(e) && (
          <span className="absolute right-3 top-3 rounded bg-error-container px-2 py-1 text-[10px] font-bold text-error">
            COMPLET
          </span>
        )}
        <div className="flex flex-wrap gap-1">
          {e.styles?.map((s) => (
            <span key={s} className="chip !py-0.5 !text-[10px]">
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-head text-lg font-bold">{e.titre}</h3>
        <p className="text-xs font-bold uppercase text-accent-amber">
          {dt(e.dateDebut)}
        </p>
        <p className="text-sm text-on-surface-muted">
          <Icon n="location_on" className="!text-base" /> {e.lieu}, {e.ville}
        </p>
        <div className="mt-auto flex justify-between border-t border-outline-variant/20 pt-3 text-xs">
          <span className="text-on-surface-muted">{e.promoteur?.nom}</span>
          <span className="font-bold">
            {prix != null ? `À partir de ${eur(prix)}` : "—"}
          </span>
        </div>
      </div>
    </Link>
  );
}
