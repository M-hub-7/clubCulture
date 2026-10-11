import { AsyncView, SelectField } from "@/components/ui";
import { BILLET_STATUTS } from "@/app/lib/constants";
import type { FetchState } from "@/app/lib/hooks";
import type { EvenementAdmin, StatutBillet } from "@/types";

interface TicketFiltersProps {
  events: FetchState<EvenementAdmin[]>;
  eventId: string;
  onEvent: (id: string) => void;
  statut: StatutBillet | "";
  onStatut: (s: StatutBillet | "") => void;
}

export default function TicketFilters({
  events,
  eventId,
  onEvent,
  statut,
  onStatut,
}: TicketFiltersProps) {
  return (
    <AsyncView state={events}>
      {(list) => (
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField
            label="Événement"
            value={eventId}
            onChange={(e) => onEvent(e.target.value)}
          >
            <option value="">Choisir un événement…</option>
            {list.map((e) => (
              <option key={e.id} value={e.id}>
                {e.titre} ({e._count.commandes} cmd)
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Statut"
            value={statut}
            onChange={(e) => onStatut(e.target.value as StatutBillet | "")}
          >
            <option value="">Tous</option>
            {BILLET_STATUTS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </SelectField>
        </div>
      )}
    </AsyncView>
  );
}
