"use client";

import { useParams, useRouter } from "next/navigation";
import EventForm from "@/components/events/EventForm";
import { AsyncView, PageHeader } from "@/components/ui";
import { useFetch } from "@/app/lib/hooks";
import { eventsService, promoteurService } from "@/app/lib/services";
import type { EventPayload } from "@/types";

export default function ModifierEvenementPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const state = useFetch(() => eventsService.get(id), [id]);

  const save = async (payload: EventPayload) => {
    await promoteurService.update(id, payload);
    router.push(`/promoteur/evenements/${id}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Modifier l'événement" />
      <AsyncView state={state}>
        {(e) => <EventForm initial={e} label="Enregistrer" onSubmit={save} />}
      </AsyncView>
    </div>
  );
}
