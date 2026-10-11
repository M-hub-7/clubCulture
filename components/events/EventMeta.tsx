import type { ReactNode } from "react";
import { Icon } from "@/components/ui";
import { dt } from "@/app/lib/format";
import type { Evenement } from "@/types";

interface TileProps {
  icon: string;
  color: string;
  label: string;
  children: ReactNode;
}

const Tile = ({ icon, color, label, children }: TileProps) => (
  <div className="card flex items-center gap-3">
    <Icon n={icon} className={color} />
    <div>
      <p className="lbl !mb-0">{label}</p>
      {children}
    </div>
  </div>
);

export default function EventMeta({ e }: { e: Evenement }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Tile
        icon="calendar_month"
        color="text-accent-amber"
        label="Date & heure"
      >
        <p className="text-sm font-semibold">{dt(e.dateDebut)}</p>
      </Tile>
      <Tile icon="location_on" color="text-secondary" label="Lieu">
        <p className="text-sm font-semibold">
          {e.lieu}, {e.ville}
        </p>
        {e.adresse && (
          <p className="text-xs text-on-surface-muted">{e.adresse}</p>
        )}
      </Tile>
    </div>
  );
}
