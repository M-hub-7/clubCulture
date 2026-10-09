"use client";

import type { FormEvent } from "react";
import { authService } from "@/app/lib/services";
import { useAction, useForm } from "@/app/lib/hooks";
import { useAuth } from "@/app/lib/auth";
import { Alert, Field } from "@/components/ui";
import type { Profile } from "@/types";

export default function ProfileForm({ user }: { user: Profile }) {
  const { update } = useAuth();
  const { bind, f } = useForm({ nom: user.nom ?? "", email: user.email });
  const action = useAction();

  const save = (e: FormEvent) => {
    e.preventDefault();
    void action.run(async () => {
      const data = await authService.updateProfile(f);
      // Garde la session locale synchronisée avec le profil modifié.
      update({
        id: data.user.id,
        nom: data.user.nom,
        email: data.user.email,
        roles: data.user.roles,
      });
      return data;
    });
  };

  return (
    <form onSubmit={save} className="card max-w-lg space-y-4">
      <div className="flex flex-wrap gap-2">
        {user.roles.map((r) => (
          <span key={r} className="chip !text-accent-amber">
            {r}
          </span>
        ))}
      </div>
      <Field label="Nom" {...bind("nom")} error={action.errors.nom} />
      <Field
        label="Email"
        type="email"
        {...bind("email")}
        error={action.errors.email}
      />
      <Alert ok>{action.msg}</Alert>
      <Alert>{action.error}</Alert>
      <button className="btn" disabled={action.busy}>
        Enregistrer
      </button>
      <p className="text-xs text-on-surface-muted">
        Membre depuis le {new Date(user.createdAt).toLocaleDateString("fr-FR")}
      </p>
    </form>
  );
}
