import { eurCents, fraisDe } from "@/app/lib/format";

interface PriceSummaryProps {
  /** Sous-total en centimes (hors frais). */
  sub: number;
  /** Frais de service ; calculés à 5 % par défaut. */
  frais?: number;
  label?: string;
}

/** Récapitulatif de prix partagé entre la fiche événement et le paiement. */
export default function PriceSummary({
  sub,
  frais = fraisDe(sub),
  label = "Billets",
}: PriceSummaryProps) {
  return (
    <div className="space-y-1 border-t border-outline-variant/30 pt-4 text-sm text-on-surface-muted">
      <div className="flex justify-between">
        <span>{label}</span>
        <span>{eurCents(sub)}</span>
      </div>
      <div className="flex justify-between">
        <span>Frais de service (5%)</span>
        <span>{eurCents(frais)}</span>
      </div>
      <div className="flex items-end justify-between pt-2">
        <span className="lbl !mb-0">Total TTC</span>
        <span className="font-head text-2xl font-extrabold text-accent-amber">
          {eurCents(sub + frais)}
        </span>
      </div>
    </div>
  );
}
