"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { authService } from "@/app/lib/services";
import { validerMotDePasse } from "@/app/lib/password";
import { useAction } from "@/app/lib/hooks";
import AuthCard from "@/components/auth/AuthCard";
import { Alert, Field } from "@/components/ui";

export default function ReinitialiserMotDePassePage() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const action = useAction();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const token =
      new URLSearchParams(window.location.search).get("token") ?? "";

    void action.run(async () => {
      if (!token)
        throw new Error(
          "Le lien de réinitialisation est invalide ou incomplet.",
        );
      const check = validerMotDePasse(password);
      if (!check.valide) throw new Error(check.erreur);
      if (password !== confirmation)
        throw new Error("Les deux mots de passe ne correspondent pas.");
      await authService.reset(token, password);
    });
  };

  return (
    <AuthCard
      title="Nouveau mot de passe"
      subtitle="Choisissez un mot de passe conforme aux règles de sécurité."
      onSubmit={submit}
    >
      <Field
        label="Nouveau mot de passe"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <p className="-mt-2 text-xs leading-5 text-white/45">
        8 caractères minimum, majuscule, minuscule, chiffre et caractère
        spécial. Le backend vérifie également que le nouveau mot de passe est
        différent de l'ancien.
      </p>
      <Field
        label="Confirmer le mot de passe"
        type="password"
        autoComplete="new-password"
        value={confirmation}
        onChange={(e) => setConfirmation(e.target.value)}
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
          {action.busy ? "Réinitialisation…" : "Réinitialiser"}
        </button>
      )}
    </AuthCard>
  );
}
