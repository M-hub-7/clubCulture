import { Bar } from "@/components/ui";
import { eur } from "@/app/lib/format";
import type { Categorie } from "@/types";

export default function CategoryTable({
  categories,
}: {
  categories: Categorie[];
}) {
  return (
    <section className="card space-y-3">
      <h2 className="font-head text-lg font-bold">Catégories de billets</h2>
      {categories.map((c) => (
        <div
          key={c.id}
          className="flex flex-wrap items-center gap-4 border-t border-outline-variant/20 pt-3 text-sm"
        >
          <span className="min-w-32 font-semibold">{c.libelle}</span>
          <span className="font-bold text-accent-amber">{eur(c.prix)}</span>
          <span>
            {c.vendu}/{c.quantite}
          </span>
          <div className="w-32">
            <Bar v={c.vendu} max={c.quantite} />
          </div>
        </div>
      ))}
    </section>
  );
}
