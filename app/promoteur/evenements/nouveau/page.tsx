"use client";

import { useRouter } from "next/navigation";
import EventForm from "@/components/events/EventForm";
import { PageHeader } from "@/components/ui";
import { promoteurService } from "@/app/lib/services";
import type { EventPayload } from "@/types";

export default function NouvelEvenementPage() {
  const router = useRouter();

  const saveDraft = async (payload: EventPayload) => {
    const { evenement } = await promoteurService.create(payload);
    router.push(`/promoteur/evenements/${evenement.id}`);
  };

  const submitForModeration = async (payload: EventPayload) => {
    const { evenement } = await promoteurService.create(payload, true);
    router.push(`/promoteur/evenements/${evenement.id}`);
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <PageHeader
        title="Créer un événement"
        subtitle="Préparez votre événement, ajoutez les catégories de billets, puis enregistrez-le ou soumettez-le à la modération."
      />
      <div className="card border-l-4 border-l-accent-amber">
        <h2 className="font-semibold">Comment fonctionne la validation ?</h2>
        <p className="mt-1 text-sm text-on-surface-muted">Un brouillon reste privé dans votre espace. Quand vous le soumettez à la modération, l'administrateur vérifie les informations. L'événement ne devient public qu'après son approbation.</p>
      </div>
      <EventForm
        withCategories
        label="Enregistrer le brouillon"
        onSubmit={saveDraft}
        onSubmitForModeration={submitForModeration}
      />
    </div>
  );
}
