import { ALL_ROLES } from "@/app/lib/constants";
import type { Role } from "@/types";

interface UserFiltersProps {
  q: string;
  onQ: (value: string) => void;
  role: Role | "";
  onRole: (value: Role | "") => void;
}

export default function UserFilters({
  q,
  onQ,
  role,
  onRole,
}: UserFiltersProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
      <input
        className="input"
        placeholder="Rechercher par nom ou email…"
        value={q}
        onChange={(e) => onQ(e.target.value)}
      />
      <select
        className="input"
        value={role}
        onChange={(e) => onRole(e.target.value as Role | "")}
      >
        <option value="">Tous les rôles</option>
        {ALL_ROLES.map((r) => (
          <option key={r}>{r}</option>
        ))}
      </select>
    </div>
  );
}
