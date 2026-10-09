import type { Evenement } from "@/types";

export default function OrganizerCard({ e }: { e: Evenement }) {
  return (
    <div className="card flex items-center justify-between">
      <div>
        <p className="lbl !mb-0">Organisateur</p>
        <p className="font-head text-lg font-bold">{e.promoteur?.nom}</p>
      </div>
      <span className="text-xs text-on-surface-muted">{e._count?.commandes ?? 0} commandes</span>
    </div>
  );
}
