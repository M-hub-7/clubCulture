import { dt } from "@/app/lib/format";
import type { Evenement, PayoutResult } from "@/types";

interface PayoutPanelProps {
  event: Evenement;
  hasBeneficiaries: boolean;
  onPayout: () => void;
  busy: boolean;
  result: PayoutResult | null;
}

/** Déclenche la répartition des recettes (possible seulement après la fin de l'événement). */
export default function PayoutPanel({
  event,
  hasBeneficiaries,
  onPayout,
  busy,
  result,
}: PayoutPanelProps) {
  const termine = new Date() >= new Date(event.dateFin);

  return (
    <div className="space-y-3 border-t border-outline-variant/20 pt-4">
      <button
        className="btn w-full"
        disabled={busy || !termine || !hasBeneficiaries}
        onClick={onPayout}
      >
        Valider et verser les recettes
      </button>

      {!termine && (
        <p className="text-xs text-on-surface-muted">
          Disponible après la fin de l&apos;événement ({dt(event.dateFin)}).
        </p>
      )}

      {result && (
        <div className="rounded-xl bg-accent-green/10 p-4 text-sm">
          <p className="font-bold text-secondary">
            {result.message} — {result.recettesTotalesFormatees} répartis
          </p>
          {result.versementsEffectues.map((v) => (
            <p key={v.stripeTransferId}>
              {v.beneficiaire} ({v.role}) : {v.montantFormate}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
