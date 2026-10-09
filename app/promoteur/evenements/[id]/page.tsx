"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Alert, AsyncView, Badge, PageHeader } from "@/components/ui";
import EventActions from "@/components/promoteur/EventActions";
import CategoryTable from "@/components/promoteur/CategoryTable";
import BeneficiarySection from "@/components/promoteur/BeneficiarySection";
import { useAction, useFetch } from "@/app/lib/hooks";
import { eventsService, promoteurService } from "@/app/lib/services";
import { dt } from "@/app/lib/format";

/** Gestion d'un événement : statut, actions, catégories, bénéficiaires & répartition. */
export default function GestionEvenementPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const event = useFetch(() => eventsService.get(id), [id]);
  const action = useAction();

  const submit = () =>
    action.run(async () => {
      const result = await promoteurService.submit(id);
      await event.reload();
      return result;
    });

  const remove = async () => {
    if (!confirm("Supprimer cet événement ?")) return;
    if (await action.run(() => promoteurService.remove(id)))
      router.push("/promoteur/dashboard");
  };

  return (
    <div className="space-y-6">
      <Link
        href="/promoteur/dashboard"
        className="text-xs text-on-surface-muted hover:text-accent-amber"
      >
        ← Mes événements
      </Link>

      <AsyncView state={event}>
        {(e) => (
          <>
            <PageHeader
              title={e.titre}
              subtitle={`${dt(e.dateDebut)} · ${e.lieu}, ${e.ville}`}
            >
              <Badge s={e.statut} />
            </PageHeader>
            <Alert ok>{action.msg}</Alert>
            <Alert>{action.error}</Alert>
            {e.statut === "BROUILLON" && (
              <div className="rounded-xl border border-outline-variant/40 bg-surface-card/70 p-4">
                <p className="font-semibold">Votre événement est encore un brouillon.</p>
                <p className="mt-1 text-sm text-on-surface-muted">Vérifiez les informations et les catégories de billets, puis cliquez sur « Soumettre à modération ». L'événement restera privé jusqu'à la validation de l'administrateur.</p>
              </div>
            )}
            {e.statut === "EN_MODERATION" && (
              <div className="rounded-xl border border-accent-amber/30 bg-accent-amber/10 p-4">
                <p className="font-semibold">Validation administrateur en cours</p>
                <p className="mt-1 text-sm text-on-surface-muted">Votre événement a été envoyé à l'équipe Club Culture. Il ne sera visible publiquement qu'après approbation.</p>
              </div>
            )}
            {e.statut === "PUBLIE" && (
              <div className="rounded-xl border border-accent-green/30 bg-accent-green/10 p-4">
                <p className="font-semibold">Votre événement est publié</p>
                <p className="mt-1 text-sm text-on-surface-muted">La page publique est accessible aux participants. Vous pouvez suivre les ventes depuis votre tableau de bord.</p>
              </div>
            )}
            <EventActions
              event={e}
              onSubmit={submit}
              onDelete={remove}
              busy={action.busy}
            />
            <section className="card grid gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
              <div className="overflow-hidden rounded-xl bg-surface-card">
                {e.visuel ? (
                  <img src={e.visuel} alt={`Affiche de ${e.titre}`} className="h-56 w-full object-cover" />
                ) : (
                  <div className="flex h-56 items-center justify-center px-5 text-center text-sm text-on-surface-muted">Aucune affiche ajoutée</div>
                )}
              </div>
              <div className="space-y-3">
                <h2 className="font-head text-lg font-bold">Aperçu de l'événement</h2>
                <p className="whitespace-pre-wrap text-sm leading-6 text-on-surface-muted">{e.description || "Aucune description renseignée."}</p>
                <div className="flex flex-wrap gap-2">
                  {e.styles.map((style) => <span key={style} className="chip">{style}</span>)}
                </div>
                {e.adresse && <p className="text-sm text-on-surface-muted">Adresse : {e.adresse}</p>}
              </div>
            </section>
            <CategoryTable categories={e.categories} />
            <BeneficiarySection event={e} />
          </>
        )}
      </AsyncView>
    </div>
  );
}
