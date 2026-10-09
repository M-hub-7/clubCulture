import type { ButtonHTMLAttributes, ReactNode } from "react";

// ─── Badge de statut ──────────────────────────────────────────────────────
const BADGE_COLORS: Record<string, string> = {
  BROUILLON: "bg-surface-high text-on-surface-muted",
  EN_MODERATION: "bg-accent-amber/15 text-accent-amber",
  PUBLIE: "bg-accent-green/20 text-secondary",
  PAYE: "bg-accent-green/20 text-secondary",
  VALIDE: "bg-accent-green/20 text-secondary",
  UTILISE: "bg-surface-high text-on-surface-muted",
  REMBOURSE: "bg-error-container/40 text-error",
  ANNULE: "bg-error-container/40 text-error",
};

export const Badge = ({ s }: { s: string }) => (
  <span
    className={`whitespace-nowrap rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
      BADGE_COLORS[s] || "bg-surface-high"
    }`}
  >
    {String(s).replace("_", " ")}
  </span>
);

// ─── Barre de progression ─────────────────────────────────────────────────
export const Bar = ({ v, max }: { v: number; max: number }) => (
  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-high">
    <div
      className="h-full rounded-full bg-accent-amber"
      style={{ width: `${max ? Math.min(100, (v / max) * 100) : 0}%` }}
    />
  </div>
);

// ─── Pastille cliquable (filtre / toggle) ─────────────────────────────────
type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean };

export const Chip = ({ active, className = "", ...props }: ChipProps) => (
  <button
    type="button"
    className={`chip ${active ? "!border-accent-amber !bg-accent-amber !text-[#452b00]" : ""} ${className}`}
    {...props}
  />
);

// ─── Carte de statistique ─────────────────────────────────────────────────
export const StatCard = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="card">
    <p className="lbl">{label}</p>
    <p className="font-head text-3xl font-extrabold">{value}</p>
  </div>
);

// ─── En-tête de page ──────────────────────────────────────────────────────
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

export const PageHeader = ({ title, subtitle, children }: PageHeaderProps) => (
  <div className="flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 className="h1">{title}</h1>
      {subtitle && <p className="mt-1 text-on-surface-muted">{subtitle}</p>}
    </div>
    {children}
  </div>
);

// ─── Onglets ──────────────────────────────────────────────────────────────
/** [valeur, libellé, compteur?] */
export type TabItem = [value: string, label: string, count?: number];

interface TabsProps {
  tabs: TabItem[];
  value: string;
  onChange: (value: string) => void;
}

export const Tabs = ({ tabs, value, onChange }: TabsProps) => (
  <div className="flex gap-6 overflow-x-auto border-b border-outline-variant/30">
    {tabs.map(([v, label, count]) => (
      <button
        key={v}
        onClick={() => onChange(v)}
        className={`whitespace-nowrap pb-3 text-sm font-semibold ${
          value === v ? "border-b-2 border-accent-amber text-accent-amber" : "text-on-surface-muted"
        }`}
      >
        {label}
        {!!count && (
          <span className="ml-2 rounded-full bg-error-container px-2 text-[10px] text-error">
            {count}
          </span>
        )}
      </button>
    ))}
  </div>
);
