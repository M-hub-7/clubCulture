import { Field, Icon } from "@/components/ui";

/** Catégorie en cours de saisie (tout en chaînes, converti à l'envoi). */
export interface CategoryDraft {
  libelle: string;
  prix: string;
  quantite: string;
  ouverture: string;
  fermeture: string;
}

export const emptyCategory: CategoryDraft = {
  libelle: "",
  prix: "",
  quantite: "",
  ouverture: "",
  fermeture: "",
};

interface CategoryFieldsProps {
  cats: CategoryDraft[];
  onChange: (cats: CategoryDraft[]) => void;
}

/** Bloc « catégories de billets » du formulaire de création. */
export default function CategoryFields({ cats, onChange }: CategoryFieldsProps) {
  const set = (i: number, key: keyof CategoryDraft, value: string) =>
    onChange(cats.map((c, j) => (j === i ? { ...c, [key]: value } : c)));

  const input = (i: number, key: keyof CategoryDraft) => ({
    value: cats[i][key],
    onChange: (e: { target: { value: string } }) => set(i, key, e.target.value),
  });

  return (
    <section className="space-y-3">
      <h2 className="font-head text-xl font-bold">Catégories de billets</h2>

      {cats.map((_, i) => (
        <div key={i} className="card grid gap-3 md:grid-cols-6">
          <div className="md:col-span-2">
            <Field label="Libellé" placeholder="Early Bird" {...input(i, "libelle")} />
          </div>
          <Field label="Prix (€)" type="number" min="0" step="1" {...input(i, "prix")} />
          <Field label="Quantité" type="number" min="1" {...input(i, "quantite")} />
          <Field label="Ouverture ventes" type="datetime-local" {...input(i, "ouverture")} />
          <Field label="Fin ventes" type="datetime-local" {...input(i, "fermeture")} />
          {cats.length > 1 && (
            <button
              type="button"
              onClick={() => onChange(cats.filter((_, j) => j !== i))}
              className="text-left text-xs text-error md:col-span-6"
            >
              Retirer cette catégorie
            </button>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...cats, { ...emptyCategory }])}
        className="w-full rounded-xl border-2 border-dashed border-outline-variant/60 py-5 text-sm text-on-surface-muted hover:border-accent-amber"
      >
        <Icon n="add" /> Ajouter une catégorie
      </button>
    </section>
  );
}
