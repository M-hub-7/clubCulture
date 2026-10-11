import Link from "next/link";
import type { Evenement } from "@/types";

interface EventActionsProps {
  event: Evenement;
  onSubmit: () => void;
  onDelete: () => void;
  busy: boolean;
}

/** Actions disponibles selon le statut : modifier / soumettre / voir / supprimer. */
export default function EventActions({ event, onSubmit, onDelete, busy }: EventActionsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {event.statut === "BROUILLON" && (
        <>
          <Link href={`/promoteur/evenements/${event.id}/modifier`} className="btn-ghost">
            Modifier
          </Link>
          <button disabled={busy} onClick={onSubmit} className="btn">
            Soumettre à modération
          </button>
        </>
      )}
      {event.statut === "PUBLIE" && (
        <Link href={`/evenements/${event.id}`} className="btn-ghost">
          Voir la page publique
        </Link>
      )}
      <button disabled={busy} onClick={onDelete} className="btn-ghost !border-error/40 !text-error">
        Supprimer
      </button>
    </div>
  );
}
