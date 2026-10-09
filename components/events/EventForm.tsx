"use client";

import { useState, type FormEvent } from "react";
import { useAction, useForm } from "@/app/lib/hooks";
import { toEurosEntiers, toInputDate, toIso } from "@/app/lib/format";
import { Alert, Field } from "@/components/ui";
import EventDetailsFields from "./EventDetailsFields";
import CategoryFields, { emptyCategory, type CategoryDraft } from "./CategoryFields";
import type { Evenement, EventPayload } from "@/types";

type SubmissionIntent = "BROUILLON" | "EN_MODERATION";

interface EventFormProps {
  initial?: Evenement;
  withCategories?: boolean;
  label: string;
  onSubmit: (payload: EventPayload, intent?: SubmissionIntent) => Promise<unknown>;
  onSubmitForModeration?: (payload: EventPayload) => Promise<unknown>;
}

interface FormState {
  titre: string;
  description: string;
  visuel: string;
  lieu: string;
  ville: string;
  adresse: string;
  styles: string[];
  dateDebut: string;
  dateFin: string;
}

/** Formulaire partagé : création en brouillon, soumission à modération et modification. */
export default function EventForm({ initial, withCategories, onSubmit, onSubmitForModeration, label }: EventFormProps) {
  const { f, setF, bind } = useForm<FormState>({
    titre: initial?.titre ?? "",
    description: initial?.description ?? "",
    visuel: initial?.visuel ?? "",
    lieu: initial?.lieu ?? "",
    ville: initial?.ville ?? "Paris",
    adresse: initial?.adresse ?? "",
    styles: initial?.styles ?? [],
    dateDebut: toInputDate(initial?.dateDebut),
    dateFin: toInputDate(initial?.dateFin),
  });
  const [cats, setCats] = useState<CategoryDraft[]>([{ ...emptyCategory }]);
  const action = useAction();

  const toggleStyle = (style: string) => setF({
    ...f,
    styles: f.styles.includes(style) ? f.styles.filter((s) => s !== style) : [...f.styles, style],
  });

  const buildPayload = (): EventPayload => ({
    titre: f.titre.trim(), description: f.description.trim(), visuel: f.visuel.trim(),
    lieu: f.lieu.trim(), ville: f.ville.trim(), adresse: f.adresse.trim(), styles: f.styles,
    dateDebut: toIso(f.dateDebut), dateFin: toIso(f.dateFin),
    ...(withCategories && { categories: cats.map((c) => ({
      libelle: c.libelle.trim(), prix: toEurosEntiers(c.prix), quantite: Number(c.quantite) || 0,
      ...(c.ouverture && { ouverture: toIso(c.ouverture) }),
      ...(c.fermeture && { fermeture: toIso(c.fermeture) }),
    })) }),
  });

  const validate = (intent: SubmissionIntent): string | null => {
    if (!f.titre.trim()) return "Le titre de l'événement est obligatoire.";
    if (!f.description.trim()) return "La description de l'événement est obligatoire.";
    if (!f.lieu.trim() || !f.ville.trim()) return "Le lieu et la ville sont obligatoires.";
    if (!f.dateDebut || !f.dateFin) return "Les dates de début et de fin sont obligatoires.";
    const start = new Date(f.dateDebut);
    const end = new Date(f.dateFin);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "Les dates saisies sont invalides.";
    if (end <= start) return "La date de fin doit être postérieure à la date de début.";
    if (f.styles.length === 0) return "Sélectionnez au moins un style.";
    if (f.visuel.trim() && !/^https?:\/\//i.test(f.visuel.trim())) return "L'affiche doit être une URL commençant par https:// ou http://.";
    if (withCategories) {
      if (cats.length === 0) return "Ajoutez au moins une catégorie de billet.";
      for (let i = 0; i < cats.length; i++) {
        const c = cats[i];
        if (!c.libelle.trim()) return `Le nom de la catégorie ${i + 1} est obligatoire.`;
        if (c.prix.trim() === "" || !Number.isFinite(Number(c.prix)) || Number(c.prix) < 0) return `Le prix de la catégorie ${i + 1} doit être un montant positif ou nul.`;
        if (!c.quantite.trim() || !Number.isInteger(Number(c.quantite)) || Number(c.quantite) <= 0) return `La quantité de la catégorie ${i + 1} doit être un entier supérieur à zéro.`;
        if (c.ouverture && Number.isNaN(new Date(c.ouverture).getTime())) return `La date d'ouverture de la catégorie ${i + 1} est invalide.`;
        if (c.fermeture && Number.isNaN(new Date(c.fermeture).getTime())) return `La date de fermeture de la catégorie ${i + 1} est invalide.`;
        if (c.ouverture && c.fermeture && new Date(c.fermeture) <= new Date(c.ouverture)) return `La fermeture des ventes de la catégorie ${i + 1} doit être postérieure à son ouverture.`;
      }
    }
    if (intent === "EN_MODERATION" && start <= new Date()) return "Pour soumettre l'événement à modération, sa date de début doit être dans le futur.";
    return null;
  };

  // Le submit standard du formulaire est toujours réservé à l'enregistrement en brouillon.
  // La soumission à la modération a son propre gestionnaire de clic : on ne dépend donc
  // pas de SubmitEvent.submitter, qui peut être absent selon le déclenchement du formulaire.
  const submitDraft = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const error = validate("BROUILLON");
    if (error) {
      void action.run(async () => { throw new Error(error); });
      return;
    }
    void action.run(() => onSubmit(buildPayload(), "BROUILLON"));
  };

  const submitForModeration = () => {
    if (!onSubmitForModeration) return;
    const error = validate("EN_MODERATION");
    if (error) {
      void action.run(async () => { throw new Error(error); });
      return;
    }
    void action.run(() => onSubmitForModeration(buildPayload()));
  };

  return (
    <form onSubmit={submitDraft} className="space-y-6">
      <EventDetailsFields bind={bind} styles={f.styles} onToggle={toggleStyle} />
      <section className="card space-y-2">
        <Field label="URL de l'affiche (facultatif)" type="url" placeholder="https://exemple.com/affiche.jpg" {...bind("visuel")} />
        <p className="text-xs text-on-surface-muted">Ajoutez un lien public vers l'affiche de votre événement.</p>
      </section>
      {withCategories && <CategoryFields cats={cats} onChange={setCats} />}
      <Alert>{action.error}</Alert>
      <Alert ok>{action.msg}</Alert>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button type="submit" name="intent" value="draft" className="btn-ghost" disabled={action.busy}>
          {action.busy ? "Enregistrement…" : label}
        </button>
        {onSubmitForModeration && (
          <button type="button" onClick={submitForModeration} className="btn" disabled={action.busy}>
            {action.busy ? "Soumission en cours…" : "Soumettre à la modération"}
          </button>
        )}
      </div>
      {onSubmitForModeration && <p className="text-xs text-on-surface-muted">L'enregistrement conserve l'événement en brouillon. La soumission l'envoie à l'administrateur pour validation ; il ne sera pas publié avant son approbation.</p>}
    </form>
  );
}
