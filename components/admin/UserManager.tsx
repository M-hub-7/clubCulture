"use client";

import { useState } from "react";
import { AsyncView, PageHeader } from "@/components/ui";
import { useFetch } from "@/app/lib/hooks";
import { adminService } from "@/app/lib/services";
import UserFilters from "./UserFilters";
import UserTable from "./UserTable";
import UserCreateForm from "./UserCreateForm";
import type { Role } from "@/types";

/** Gestion des utilisateurs : recherche, filtre par rôle, édition des rôles, création. */
export default function UserManager() {
  const [q, setQ] = useState("");
  const [role, setRole] = useState<Role | "">("");
  const [creating, setCreating] = useState(false);
  const state = useFetch(() => adminService.users({ q, role }), [q, role]);

  return (
    <div className="space-y-6">
      <PageHeader title="Utilisateurs & rôles">
        <button onClick={() => setCreating(!creating)} className="btn">
          {creating ? "Fermer" : "Créer un utilisateur"}
        </button>
      </PageHeader>

      {creating && <UserCreateForm onCreated={state.reload} />}
      <UserFilters q={q} onQ={setQ} role={role} onRole={setRole} />

      <AsyncView state={state}>
        {(users) => <UserTable users={users} onChanged={state.reload} />}
      </AsyncView>
    </div>
  );
}
