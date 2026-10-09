"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AsyncView, Empty, PageHeader, StatCard } from "@/components/ui";
import KpiGrid from "@/components/promoteur/KpiGrid";
import StatusFilter from "@/components/promoteur/StatusFilter";
import EventRow from "@/components/promoteur/EventRow";
import { useFetch } from "@/app/lib/hooks";
import { promoteurService } from "@/app/lib/services";
import type { StatutEvenement } from "@/types";

export default function DashboardPage() {
  const [statut, setStatut] = useState<StatutEvenement | "">("");
  // Load all events once: KPIs must not change when the user filters the list.
  const state = useFetch(() => promoteurService.mine(), []);
  const events = state.data ?? [];
  const filteredEvents = useMemo(
    () => (statut ? events.filter((event) => event.statut === statut) : events),
    [events, statut],
  );
  const drafts = events.filter((event) => event.statut === "BROUILLON").length;
  const moderation = events.filter((event) => event.statut === "EN_MODERATION").length;
  const published = events.filter((event) => event.statut === "PUBLIE").length;

  return (
    <div className="space-y-7">
      <PageHeader
        title="Espace promoteur"
        subtitle="Créez vos événements, suivez leur validation et consultez vos ventes."
      >
        <Link href="/promoteur/evenements/nouveau" className="btn">
          + Créer un événement
        </Link>
      </PageHeader>

      <AsyncView state={state}>
        {(loadedEvents) => (
          <>
            <KpiGrid events={loadedEvents} />

            <section className="grid gap-3 sm:grid-cols-3">
              <StatCard label="Brouillons à terminer" value={drafts} />
              <StatCard label="En attente de validation" value={moderation} />
              <StatCard label="Événements publiés" value={published} />
            </section>

            {moderation > 0 && (
              <div className="rounded-xl border border-accent-amber/30 bg-accent-amber/10 p-4">
                <p className="font-semibold">{moderation} événement{moderation > 1 ? "s" : ""} en attente de validation</p>
                <p className="mt-1 text-sm text-on-surface-muted">
                  L'administrateur doit approuver chaque événement avant sa publication. Vous pouvez consulter son statut depuis la liste ci-dessous.
                </p>
              </div>
            )}

            <section className="space-y-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="font-head text-xl font-bold">Mes événements</h2>
                  <p className="mt-1 text-sm text-on-surface-muted">{filteredEvents.length} résultat{filteredEvents.length > 1 ? "s" : ""}</p>
                </div>
                <StatusFilter value={statut} onChange={setStatut} />
              </div>

              {filteredEvents.length ? (
                <div className="space-y-4">
                  {filteredEvents.map((event) => <EventRow key={event.id} e={event} />)}
                </div>
              ) : (
                <Empty>
                  {events.length === 0 ? (
                    <>
                      Vous n'avez pas encore créé d'événement. {" "}
                      <Link href="/promoteur/evenements/nouveau" className="text-accent-amber">
                        Créer mon premier événement →
                      </Link>
                    </>
                  ) : (
                    <>Aucun événement avec ce statut. <button className="text-accent-amber" onClick={() => setStatut("")}>Afficher tous les événements</button></>
                  )}
                </Empty>
              )}
            </section>
          </>
        )}
      </AsyncView>
    </div>
  );
}
