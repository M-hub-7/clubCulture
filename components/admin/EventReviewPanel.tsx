"use client";

import { useEffect, useState, type ReactNode } from "react";
import { adminService } from "@/app/lib/services";
import { useAction, useFetch } from "@/app/lib/hooks";
import { dtLong, eur } from "@/app/lib/format";
import { Alert, AsyncView, Badge, TextAreaField } from "@/components/ui";

const Info = ({ label, children }: { label: string; children: ReactNode }) => (
  <div>
    <p className="lbl !mb-0">{label}</p>
    <p className="text-sm font-semibold">{children}</p>
  </div>
);

interface EventReviewPanelProps {
  id: string;
  onChanged: () => void;
  onDeleted: () => void;
}

/** Panneau de revue d'un événement : détail + décision (approuver / rejeter) + suppression. */
export default function EventReviewPanel({
  id,
  onChanged,
  onDeleted,
}: EventReviewPanelProps) {
  const state = useFetch(() => adminService.event(id), [id]);
  const [raison, setRaison] = useState("");
  const action = useAction();

  useEffect(() => setRaison(""), [id]);

  const decide = (decision: "PUBLIE" | "BROUILLON") =>
    action.run(async () => {
      if (decision === "BROUILLON" && !raison.trim()) {
        throw new Error("Le motif du rejet est obligatoire.");
      }
      const result = await adminService.decide(id, decision, raison.trim());
      await state.reload();
      onChanged();
      return result;
    });

  const remove = async () => {
    if (!confirm("Supprimer définitivement cet événement ?")) return;
    if (await action.run(() => adminService.deleteEvent(id))) onDeleted();
  };

  return (
    <AsyncView state={state}>
      {(e) => (
        <aside className="card space-y-5 lg:sticky lg:top-24">
          <div>
            <Badge s={e.statut} />
            <h2 className="mt-2 font-head text-2xl font-extrabold">
              {e.titre}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Info label="Organisateur">{e.promoteur?.nom}</Info>
            <Info label="Date">{dtLong(e.dateDebut)}</Info>
            <div className="col-span-2">
              <Info label="Lieu">
                {e.lieu}, {e.ville}
              </Info>
            </div>
          </div>

          {e.motifModeration && (
            <div className="rounded-xl border border-error/30 bg-error/5 p-3">
              <p className="lbl">Motif du dernier rejet</p>
              <p className="whitespace-pre-line text-sm">{e.motifModeration}</p>
            </div>
          )}

          <div>
            <p className="lbl">Description</p>
            <p className="whitespace-pre-line text-sm text-on-surface-muted">
              {e.description || "—"}
            </p>
          </div>

          <div className="space-y-1 text-sm">
            {e.categories.map((c) => (
              <div key={c.id} className="flex justify-between">
                <span>{c.libelle}</span>
                <span className="text-on-surface-muted">
                  {eur(c.prix)} · {c.vendu}/{c.quantite}
                </span>
              </div>
            ))}
          </div>

          <Alert ok>{action.msg}</Alert>
          <Alert>{action.error}</Alert>

          {e.statut === "EN_MODERATION" && (
            <div className="space-y-3 border-t border-outline-variant/30 pt-4">
              <TextAreaField
                label="Motif du rejet (obligatoire si rejeté)"
                value={raison}
                onChange={(x) => setRaison(x.target.value)}
                placeholder="Ex : description inappropriée, informations manquantes…"
              />
              <div className="flex gap-3">
                <button
                  disabled={action.busy}
                  onClick={() => decide("BROUILLON")}
                  className="btn-ghost flex-1 !border-error/50 !text-error"
                >
                  Rejeter
                </button>
                <button
                  disabled={action.busy}
                  onClick={() => decide("PUBLIE")}
                  className="btn flex-1"
                >
                  Approuver
                </button>
              </div>
              <p className="text-[11px] text-on-surface-muted">
                Un rejet renvoie l&apos;événement en brouillon chez
                l&apos;organisateur.
              </p>
            </div>
          )}

          <button
            disabled={action.busy}
            onClick={remove}
            className="text-xs text-error hover:underline"
          >
            Supprimer l&apos;événement (impossible s&apos;il a des commandes)
          </button>
        </aside>
      )}
    </AsyncView>
  );
}
