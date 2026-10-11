import { eur, placesRestantes } from "@/app/lib/format";
import type { Categorie } from "@/types";

interface TicketRowProps {
  cat: Categorie;
  qty: number;
  onStep: (delta: number) => void;
}

/** Une catégorie de billet : prix, disponibilité et sélecteur de quantité. */
export default function TicketRow({ cat, qty, onStep }: TicketRowProps) {
  const now = Date.now();
  const left = placesRestantes(cat);
  const start = new Date(cat.ouverture).getTime();
  const end = new Date(cat.fermeture).getTime();
  const open = now >= start && now <= end;
  const unavailable = left <= 0 || !open;

  return (
    <div
      className={`flex items-center justify-between gap-3 ${unavailable ? "opacity-50" : ""}`}
    >
      <div>
        <p className={`font-semibold ${left <= 0 ? "line-through" : ""}`}>
          {cat.libelle}
        </p>
        <p className="text-sm font-bold text-accent-amber">{eur(cat.prix)}</p>
        {open && left > 0 && left <= 20 && (
          <p className="text-[11px] text-error">Plus que {left} places</p>
        )}
      </div>

      {left <= 0 ? (
        <span className="chip">Complet</span>
      ) : !open ? (
        <span className="chip">{now < start ? "Bientôt" : "Clos"}</span>
      ) : (
        <div className="flex items-center gap-3 rounded-full bg-surface-deep px-2 py-1">
          <button onClick={() => onStep(-1)} className="px-2">
            −
          </button>
          <span className="w-4 text-center text-sm">{qty}</span>
          <button onClick={() => onStep(1)} className="px-2">
            +
          </button>
        </div>
      )}
    </div>
  );
}
