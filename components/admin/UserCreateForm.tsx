"use client";

import type { FormEvent } from "react";
import { adminService } from "@/app/lib/services";
import { useAction, useForm } from "@/app/lib/hooks";
import { ALL_ROLES } from "@/app/lib/constants";
import { Alert, Chip, Field } from "@/components/ui";
import type { Role } from "@/types";

interface FormState {
  nom: string;
  email: string;
  password: string;
  roles: Role[];
}

const EMPTY: FormState = {
  nom: "",
  email: "",
  password: "",
  roles: ["ACHETEUR"],
};

export default function UserCreateForm({
  onCreated,
}: {
  onCreated: () => void | Promise<void>;
}) {
  const { f, setF, bind } = useForm<FormState>(EMPTY);
  const action = useAction();

  const toggleRole = (role: Role) =>
    setF({
      ...f,
      roles: f.roles.includes(role)
        ? f.roles.filter((r) => r !== role)
        : [...f.roles, role],
    });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void action.run(async () => {
      const result = await adminService.createUser(f);
      setF(EMPTY);
      await onCreated();
      return result;
    });
  };

  return (
    <form onSubmit={submit} className="card grid gap-4 md:grid-cols-3">
      <Field label="Nom" {...bind("nom")} required />
      <Field label="Email" type="email" {...bind("email")} required />
      <Field
        label="Mot de passe (8 min.)"
        type="password"
        {...bind("password")}
        required
      />

      <div className="md:col-span-3">
        <span className="lbl">Rôles</span>
        <div className="flex flex-wrap gap-2">
          {ALL_ROLES.map((r) => (
            <Chip
              key={r}
              active={f.roles.includes(r)}
              onClick={() => toggleRole(r)}
            >
              {r}
            </Chip>
          ))}
        </div>
      </div>

      <div className="space-y-3 md:col-span-3">
        <Alert ok>{action.msg}</Alert>
        <Alert>{action.error}</Alert>
        <button className="btn" disabled={action.busy}>
          Créer l&apos;utilisateur
        </button>
      </div>
    </form>
  );
}
