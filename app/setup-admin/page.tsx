"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { adminService } from "@/app/lib/services";
import { useAction, useForm } from "@/app/lib/hooks";
import AuthCard from "@/components/auth/AuthCard";
import { Alert, Field } from "@/components/ui";
import { validerMotDePasse } from "@/app/lib/password";

/** Création du tout premier administrateur (clé ADMIN_SECRET du backend). Ne fonctionne qu'une fois. */
export default function SetupAdminPage() {
  const { f, bind } = useForm({ secret: "", nom: "", email: "", password: "" });
  const action = useAction();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const { secret, ...body } = f;
    void action.run(async () => {
      const check = validerMotDePasse(f.password, f.nom, f.email);
      if (!check.valide) throw new Error(check.erreur);
      return adminService.setup(secret, body);
    });
  };

  return (
    <AuthCard
      title="Premier administrateur"
      subtitle="Utilisez la clé secrète ADMIN_SECRET de votre serveur."
      onSubmit={submit}
    >
      <Field label="Clé secrète" type="password" {...bind("secret")} required />
      <Field label="Nom" {...bind("nom")} required />
      <Field label="Email" type="email" {...bind("email")} required />
      <Field
        label="Mot de passe"
        type="password"
        {...bind("password")}
        required
      />
      <Alert ok>{action.msg}</Alert>
      <Alert>{action.error}</Alert>
      {action.msg ? (
        <Link href="/connexion" className="btn w-full">
          Se connecter
        </Link>
      ) : (
        <button className="btn w-full" disabled={action.busy}>
          Créer l&apos;administrateur
        </button>
      )}
    </AuthCard>
  );
}
