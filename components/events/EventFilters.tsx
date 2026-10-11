import { Chip, Icon } from "@/components/ui";

interface EventFiltersProps {
  q: string;
  onQ: (value: string) => void;
  styles: string[];
  style: string;
  onStyle: (value: string) => void;
}

export default function EventFilters({ q, onQ, styles, style, onStyle }: EventFiltersProps) {
  return (
    <>
      <div className="relative">
        <Icon n="search" className="absolute left-4 top-3 text-on-surface-muted" />
        <input
          className="input !rounded-full !pl-12"
          placeholder="Rechercher un événement, un lieu, une ville…"
          value={q}
          onChange={(e) => onQ(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {["", ...styles].map((s) => (
          <Chip key={s} active={style === s} onClick={() => onStyle(s)}>
            {s || "Tout"}
          </Chip>
        ))}
      </div>
    </>
  );
}
