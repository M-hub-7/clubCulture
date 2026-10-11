"use client";

import { Alert, AsyncView } from "@/components/ui";
import { useAction, useFetch } from "@/app/lib/hooks";
import { adminService } from "@/app/lib/services";
import TicketStats from "./TicketStats";
import TicketTable from "./TicketTable";
import type { BilletAdmin, StatutBillet } from "@/types";

interface TicketsPanelProps {
  evenementId: string;
  statut: StatutBillet | "";
}

/** Billets d'un événement (stats + tableau) avec remboursement administratif. */
export default function TicketsPanel({
  evenementId,
  statut,
}: TicketsPanelProps) {
  const state = useFetch(
    () => adminService.tickets(evenementId, statut),
    [evenementId, statut],
  );
  const action = useAction();

  const refund = (billet: BilletAdmin) => {
    const raison = prompt(
      `Rembourser le billet de ${billet.nomPorteur} ? Motif :`,
      "Remboursement administratif",
    );
    if (raison === null) return;

    void action.run(async () => {
      const result = await adminService.refund(billet.id, raison);
      await state.reload();
      return { message: `${result.message} (${result.montantFormate})` };
    });
  };

  return (
    <AsyncView state={state}>
      {({ billets, stats }) => (
        <>
          <TicketStats stats={stats} />
          <Alert ok>{action.msg}</Alert>
          <Alert>{action.error}</Alert>
          <TicketTable billets={billets} onRefund={refund} busy={action.busy} />
        </>
      )}
    </AsyncView>
  );
}
