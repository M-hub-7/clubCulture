"use client";

import { useState } from "react";
import { useFetch } from "@/app/lib/hooks";
import { eventsService } from "@/app/lib/services";
import { AsyncView, Empty } from "@/components/ui";
import EventCard from "./EventCard";
import EventFilters from "./EventFilters";

/** Liste publique des événements à venir, avec recherche et filtre par style. */
export default function EventList() {
  const state = useFetch(eventsService.list);
  const [q, setQ] = useState("");
  const [style, setStyle] = useState("");

  return (
    <AsyncView state={state}>
      {(list) => {
        const styles = [...new Set(list.flatMap((e) => e.styles ?? []))];
        const shown = list.filter(
          (e) =>
            (!style || e.styles?.includes(style)) &&
            `${e.titre} ${e.lieu} ${e.ville}`
              .toLowerCase()
              .includes(q.toLowerCase()),
        );

        return (
          <div className="space-y-6">
            <EventFilters
              q={q}
              onQ={setQ}
              styles={styles}
              style={style}
              onStyle={setStyle}
            />
            {shown.length ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {shown.map((e) => (
                  <EventCard key={e.id} e={e} />
                ))}
              </div>
            ) : (
              <Empty>
                Aucun événement à venir ne correspond à votre recherche.
              </Empty>
            )}
          </div>
        );
      }}
    </AsyncView>
  );
}
