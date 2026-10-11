import { Bar } from "@/components/ui";
import type { ScanStatsData } from "@/types";

export default function ScanStats({ stats }: { stats: ScanStatsData }) {
  return (
    <div className="card">
      <div className="mb-2 flex justify-between text-xs uppercase tracking-widest text-on-surface-muted">
        <span>Entrées validées</span>
        <span className="font-bold text-accent-amber">
          {stats.entres} / {stats.total}
        </span>
      </div>
      <Bar v={stats.entres} max={stats.total} />
    </div>
  );
}
