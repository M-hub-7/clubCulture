"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/lib/auth";
import { placesRestantes } from "@/app/lib/format";
import { Icon } from "@/components/ui";
import TicketRow from "./TicketRow";
import PriceSummary from "./PriceSummary";
import type { Categorie, Evenement } from "@/types";

const MAX_PAR_COMMANDE = 10;

/**
 * Sélection des billets.
 * Le backend ne traite qu'une catégorie par paiement :
 * choisir une catégorie remet les autres à 0.
 */
export default function TicketPicker({ event }: { event: Evenement }) {
  const router = useRouter();
  const { user } = useAuth();
  const [sel, setSel] = useState<{ id: string | null; q: number }>({
    id: null,
    q: 0,
  });

  const cat = event.categories.find((c) => c.id === sel.id);
  const subtotal = cat ? cat.prix * sel.q : 0;

  const step = (c: Categorie, delta: number) => {
    const current = sel.id === c.id ? sel.q : 0;
    const q = Math.max(
      0,
      Math.min(MAX_PAR_COMMANDE, placesRestantes(c), current + delta),
    );
    setSel({ id: q ? c.id : null, q });
  };

  const reserver = () =>
    router.push(
      user
        ? `/checkout?ev=${event.id}&cat=${sel.id}&q=${sel.q}`
        : `/connexion?next=${encodeURIComponent(`/evenements/${event.id}`)}`,
    );

  return (
    <aside className="card h-fit space-y-4 lg:sticky lg:top-24">
      <h2 className="font-head text-xl font-bold">
        <Icon n="confirmation_number" className="text-accent-amber" />{" "}
        Billetterie
      </h2>

      {event.categories.map((c) => (
        <TicketRow
          key={c.id}
          cat={c}
          qty={sel.id === c.id ? sel.q : 0}
          onStep={(delta) => step(c, delta)}
        />
      ))}

      <PriceSummary sub={subtotal} />

      <button
        className="btn w-full"
        disabled={!sel.id || event.statut !== "PUBLIE"}
        onClick={reserver}
      >
        Réserver maintenant
      </button>
      <p className="text-center text-[11px] text-on-surface-muted">
        Un compte « Acheteur » est requis pour payer.
      </p>
    </aside>
  );
}
