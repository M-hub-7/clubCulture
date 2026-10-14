"use client";

import Guard from "@/components/layout/Guard";
import { AsyncView, Empty } from "@/components/ui";
import OrderSection from "@/components/tickets/OrderSection";
import { useFetch } from "@/app/lib/hooks";
import { ticketsService } from "@/app/lib/services";

export default function MesBilletsPage() {
  const state = useFetch(ticketsService.mine);

  return (
    <Guard>
      <div className="wrap">
        <h1 className="h1 mb-2">Mes billets</h1>
        <p className="mb-6 text-sm text-on-surface-muted">
          Le QR code apparaît une fois le billet validé par l&apos;équipe Club
          Culture.
        </p>
        <AsyncView state={state}>
          {(commandes) =>
            commandes.length === 0 ? (
              <Empty>Vous n&apos;avez aucun billet pour le moment.</Empty>
            ) : (
              <div className="space-y-10">
                {commandes.map((c) => (
                  <OrderSection key={c.id} c={c} />
                ))}
              </div>
            )
          }
        </AsyncView>
      </div>
    </Guard>
  );
}
