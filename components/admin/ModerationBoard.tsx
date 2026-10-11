"use client";

import { useState } from "react";
import { AsyncView, Tabs } from "@/components/ui";
import { useFetch } from "@/app/lib/hooks";
import { adminService } from "@/app/lib/services";
import ModerationTable from "./ModerationTable";
import EventReviewPanel from "./EventReviewPanel";
import type { StatutEvenement } from "@/types";

/** Tableau de modération : onglets par statut, recherche, liste et panneau de revue. */
export default function ModerationBoard() {
  const state = useFetch(() => adminService.events());
  const [tab, setTab] = useState<StatutEvenement>("EN_MODERATION");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <AsyncView state={state}>
      {(events) => {
        const count = (s: StatutEvenement) =>
          events.filter((e) => e.statut === s).length;
        const shown = events.filter(
          (e) =>
            e.statut === tab &&
            `${e.titre} ${e.ville} ${e.promoteur?.nom}`
              .toLowerCase()
              .includes(q.toLowerCase()),
        );

        return (
          <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
            <div className="min-w-0 space-y-4">
              <Tabs
                value={tab}
                onChange={(t) => {
                  setTab(t as StatutEvenement);
                  setSelected(null);
                }}
                tabs={[
                  ["EN_MODERATION", "En attente", count("EN_MODERATION")],
                  ["PUBLIE", "Publiés"],
                  ["BROUILLON", "Brouillons"],
                ]}
              />
              <input
                className="input"
                placeholder="Rechercher (titre, ville, organisateur)…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <ModerationTable
                events={shown}
                selectedId={selected}
                onSelect={setSelected}
              />
            </div>

            {selected && (
              <EventReviewPanel
                id={selected}
                onChanged={state.reload}
                onDeleted={() => {
                  setSelected(null);
                  void state.reload();
                }}
              />
            )}
          </div>
        );
      }}
    </AsyncView>
  );
}
