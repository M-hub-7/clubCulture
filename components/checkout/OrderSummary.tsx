import { dt } from "@/app/lib/format";
import PriceSummary from "@/components/events/PriceSummary";
import type { Categorie, Evenement, PaymentIntentResponse } from "@/types";

interface OrderSummaryProps {
  event: Evenement;
  cat: Categorie;
  qty: number;
  /** Montants exacts renvoyés par le backend (une fois le paiement créé). */
  intent: PaymentIntentResponse | null;
}

export default function OrderSummary({
  event,
  cat,
  qty,
  intent,
}: OrderSummaryProps) {
  const subtotal = intent?.montantBillets ?? cat.prix * qty * 100;

  return (
    <aside className="card h-fit space-y-3 text-sm">
      <h2 className="font-head text-lg font-bold">{event.titre}</h2>
      <p className="text-on-surface-muted">
        {dt(event.dateDebut)} · {event.lieu}
      </p>
      <PriceSummary
        sub={subtotal}
        frais={intent?.fraisService}
        label={`${qty} × ${cat.libelle}`}
      />
    </aside>
  );
}
