import { Badge, Empty } from "@/components/ui";
import { dtLong } from "@/app/lib/format";
import type { EvenementAdmin } from "@/types";

interface ModerationTableProps {
  events: EvenementAdmin[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
}

const HEAD = "p-4";

export default function ModerationTable({
  events,
  selectedId,
  onSelect,
}: ModerationTableProps) {
  if (!events.length)
    return <Empty>Aucun événement dans cette catégorie.</Empty>;

  return (
    <div className="card overflow-x-auto !p-0">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-outline-variant/30 text-[10px] uppercase tracking-widest text-on-surface-muted">
          <tr>
            <th className={HEAD}>Événement</th>
            <th className={HEAD}>Organisateur</th>
            <th className={HEAD}>Date</th>
            <th className={HEAD}>Statut</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <tr
              key={e.id}
              onClick={() => onSelect(e.id)}
              className={`cursor-pointer border-b border-outline-variant/10 hover:bg-surface-high ${
                selectedId === e.id ? "bg-surface-high" : ""
              }`}
            >
              <td className="p-4">
                <p className="font-semibold">{e.titre}</p>
                <p className="text-xs text-on-surface-muted">
                  {e.ville} • {e.lieu}
                </p>
              </td>
              <td className="p-4">{e.promoteur?.nom}</td>
              <td className="whitespace-nowrap p-4">{dtLong(e.dateDebut)}</td>
              <td className="p-4">
                <Badge s={e.statut} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
