import { Empty } from "@/components/ui";
import RoleEditor from "./RoleEditor";
import type { AdminUser } from "@/types";

interface UserTableProps {
  users: AdminUser[];
  onChanged: () => void | Promise<void>;
}

export default function UserTable({ users, onChanged }: UserTableProps) {
  if (!users.length) return <Empty>Aucun utilisateur.</Empty>;

  return (
    <div className="card overflow-x-auto !p-0">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-outline-variant/30 text-[10px] uppercase tracking-widest text-on-surface-muted">
          <tr>
            <th className="p-4">Utilisateur</th>
            <th className="p-4">Rôles</th>
            <th className="p-4">Activité</th>
            <th className="p-4">ID</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-outline-variant/10 align-top">
              <td className="p-4">
                <p className="font-semibold">{u.nom}</p>
                <p className="text-xs text-on-surface-muted">{u.email}</p>
              </td>
              <td className="p-4">
                <RoleEditor user={u} onChanged={onChanged} />
              </td>
              <td className="p-4 text-xs text-on-surface-muted">
                {u.stats.evenements} événements · {u.stats.commandes} commandes
              </td>
              <td className="p-4">
                <code className="select-all text-[11px] text-accent-amber">{u.id}</code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
