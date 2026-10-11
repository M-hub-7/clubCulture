"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { authService } from "@/app/lib/services";
import { useAction } from "@/app/lib/hooks";
import AuthCard from "@/components/auth/AuthCard";
import { Alert, Field } from "@/components/ui";

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState("");
  const action = useAction();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void action.run(() => authService.forgot(email));
  };

  return (
    <AuthCard title="Mot de passe oublié" onSubmit={submit}>
      <Field
        label="Email du compte"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Alert ok>{action.msg}</Alert>
      <Alert>{action.error}</Alert>
      {/* Le backend répond 404 « … Veuillez vous inscrire. » si le compte n'existe pas. */}
      {action.error.includes("inscrire") && (
        <Link href="/inscription" className="text-sm text-accent-amber">
          Créer un compte →
        </Link>
      )}
      <button className="btn w-full" disabled={action.busy}>
        Envoyer le lien
      </button>
    </AuthCard>
  );
}
