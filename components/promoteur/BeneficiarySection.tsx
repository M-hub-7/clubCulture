"use client";

import { useState } from "react";
import { AsyncView } from "@/components/ui";
import { useAction, useFetch } from "@/app/lib/hooks";
import { promoteurService } from "@/app/lib/services";
import BeneficiaryList from "./BeneficiaryList";
import BeneficiaryForm from "./BeneficiaryForm";
import PayoutPanel from "./PayoutPanel";
import type { BeneficiaryPayload, Evenement, PayoutResult } from "@/types";

/** Section « Bénéficiaires & répartition » de la page de gestion d'un événement. */
export default function BeneficiarySection({ event }: { event: Evenement }) {
  const beneficiaries = useFetch(
    () => promoteurService.beneficiaries(event.id),
    [event.id],
  );
  const action = useAction();
  const [payout, setPayout] = useState<PayoutResult | null>(null);

  const add = (body: BeneficiaryPayload) =>
    action.run(async () => {
      const result = await promoteurService.addBeneficiary(event.id, body);
      await beneficiaries.reload();
      return result;
    });

  const distribute = () => {
    if (!confirm("Lancer la répartition ? Action irréversible.")) return;
    void action.run(async () => {
      const result = await promoteurService.payout(event.id);
      setPayout(result);
      await beneficiaries.reload();
      return result;
    });
  };

  return (
    <section className="card space-y-4">
      <h2 className="font-head text-lg font-bold">
        Bénéficiaires & répartition
      </h2>

      {action.error && <p className="text-sm text-error">{action.error}</p>}
      {action.msg && <p className="text-sm text-secondary">{action.msg}</p>}

      <AsyncView state={beneficiaries}>
        {(items) => (
          <>
            <BeneficiaryList items={items} />
            {(event.statut === "BROUILLON" || event.statut === "PUBLIE") && (
              <BeneficiaryForm onAdd={add} busy={action.busy} />
            )}
            {event.statut === "PUBLIE" && (
              <PayoutPanel
                event={event}
                hasBeneficiaries={items.length > 0}
                onPayout={distribute}
                busy={action.busy}
                result={payout}
              />
            )}
          </>
        )}
      </AsyncView>
    </section>
  );
}
