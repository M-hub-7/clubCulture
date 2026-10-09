"use client";

import { useParams } from "next/navigation";
import { useFetch } from "@/app/lib/hooks";
import { eventsService } from "@/app/lib/services";
import { AsyncView } from "@/components/ui";
import EventHero from "@/components/events/EventHero";
import EventMeta from "@/components/events/EventMeta";
import OrganizerCard from "@/components/events/OrganizerCard";
import TicketPicker from "@/components/events/TicketPicker";

export default function EvenementPage() {
  const { id } = useParams<{ id: string }>();
  const state = useFetch(() => eventsService.get(id), [id]);

  return (
    <div className="wrap">
      <AsyncView state={state}>
        {(e) => (
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            <div className="space-y-6">
              <EventHero e={e} />
              <EventMeta e={e} />
              <div>
                <h2 className="mb-2 font-head text-xl font-bold">À propos</h2>
                <p className="whitespace-pre-line leading-relaxed text-on-surface-muted">
                  {e.description || "Aucune description."}
                </p>
              </div>
              <OrganizerCard e={e} />
            </div>
            <TicketPicker event={e} />
          </div>
        )}
      </AsyncView>
    </div>
  );
}
