import { Badge } from "@/components/ui";
import { eurCents } from "@/app/lib/format";
import type { Beneficiaire } from "@/types";

export default function BeneficiaryList({ items }: { items: Beneficiaire[] }) {
  if (!items.length) {
    return <p className="text-sm text-on-surface-muted">Aucun bénéficiaire.</p>;
  }

  return (
    <>
      {items.map((b) => (
        <div
          key={b.id}
          className="flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/20 pt-3 text-sm"
        >
          <div>
            <p className="font-semibold">{b.user.nom}</p>
            <p className="text-xs text-on-surface-muted">
              {b.role} · {b.user.email}
            </p>
          </div>
          <span>
            {b.typePart === "FIXE" ? `${eurCents(b.valeur)} fixe` : `${b.valeur} %`}
          </span>
          <Badge s={b.statut} />
        </div>
      ))}
    </>
  );
}
