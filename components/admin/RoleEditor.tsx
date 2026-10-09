"use client";

import { adminService } from "@/app/lib/services";
import { useAction } from "@/app/lib/hooks";
import { ALL_ROLES } from "@/app/lib/constants";
import type { AdminUser, Role } from "@/types";

interface RoleEditorProps {
  user: AdminUser;
  onChanged: () => void | Promise<void>;
}

/** Pastilles de rôles (retrait via ×) + ajout par liste déroulante. */
export default function RoleEditor({ user, onChanged }: RoleEditorProps) {
  const action = useAction();

  const run = (fn: () => Promise<unknown>) =>
    action.run(async () => {
      const result = await fn();
      await onChanged();
      return result;
    });

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-1">
        {user.roles.map((role) => (
          <span key={role} className="chip !py-0.5">
            {role}
            <button
              disabled={action.busy}
              title="Retirer"
              onClick={() => run(() => adminService.removeRole(user.id, role))}
              className="ml-1 text-error"
            >
              ×
            </button>
          </span>
        ))}

        <select
          disabled={action.busy}
          value=""
          onChange={(e) =>
            e.target.value &&
            run(() => adminService.addRole(user.id, e.target.value as Role))
          }
          className="rounded-full border border-outline-variant bg-surface-deep px-2 py-1 text-[11px]"
        >
          <option value="">+ rôle</option>
          {ALL_ROLES.filter((r) => !user.roles.includes(r)).map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </div>
      {action.error && <p className="text-xs text-error">{action.error}</p>}
    </div>
  );
}
