import { dt, eurCents } from "@/app/lib/format";
import TicketCard from "./TicketCard";
import type { Commande } from "@/types";

/** Une commande payée : infos de l'événement + ses billets (QR codes). */
export default function OrderSection({ c }: { c: Commande }) {
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="font-head text-xl font-bold">{c.evenement.titre}</h2>
          <p className="text-sm text-on-surface-muted">
            {dt(c.evenement.dateDebut)} · {c.evenement.lieu},{" "}
            {c.evenement.ville}
          </p>
        </div>
        <span className="text-sm text-on-surface-muted">
          Commande {eurCents(c.montantTotal)}
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {c.billets.map((b) => (
          <TicketCard key={b.id} b={b} event={c.evenement} />
        ))}
      </div>
    </section>
  );
}
