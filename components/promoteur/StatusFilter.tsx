import { Chip } from "@/components/ui";
import type { StatutEvenement } from "@/types";

const STATUTS: (StatutEvenement | "")[] = ["", "BROUILLON", "EN_MODERATION", "PUBLIE", "ANNULE", "TERMINE"];

interface StatusFilterProps {
  value: StatutEvenement | "";
  onChange: (value: StatutEvenement | "") => void;
}

export default function StatusFilter({ value, onChange }: StatusFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {STATUTS.map((s) => (
        <Chip key={s} active={value === s} onClick={() => onChange(s)}>
          {s ? ({ BROUILLON: "Brouillons", EN_MODERATION: "En modération", PUBLIE: "Publiés", ANNULE: "Annulés", TERMINE: "Terminés" }[s]) : "Tous"}
        </Chip>
      ))}
    </div>
  );
}
