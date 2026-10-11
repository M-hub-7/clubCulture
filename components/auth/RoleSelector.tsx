import { Icon } from "@/components/ui";
import type { Role } from "@/types";

/** [rôle, titre, description, icône] */
const OPTIONS: [Role, string, string, string][] = [
  ["ACHETEUR", "Participant", "Acheter des billets", "confirmation_number"],
  ["PROMOTEUR", "Organisateur", "Créer et vendre des événements", "campaign"],
  ["PRESTATAIRE", "Prestataire", "DJ, technique, traiteur… recevoir une part", "headphones"],
];

interface RoleSelectorProps {
  value: Role;
  onChange: (role: Role) => void;
}

export default function RoleSelector({ value, onChange }: RoleSelectorProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {OPTIONS.map(([role, title, description, icon]) => (
        <button
          type="button"
          key={role}
          onClick={() => onChange(role)}
          className={`rounded-xl border p-3 text-left ${
            value === role ? "border-accent-amber bg-accent-amber/10" : "border-outline-variant/50"
          }`}
        >
          <Icon n={icon} className="text-accent-amber" />
          <p className="text-sm font-bold">{title}</p>
          <p className="text-[11px] text-on-surface-muted">{description}</p>
        </button>
      ))}
    </div>
  );
}
