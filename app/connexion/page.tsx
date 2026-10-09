"use client";

import type { FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/lib/auth";
import { homeFor } from "@/app/lib/constants";
import { useAction, useForm } from "@/app/lib/hooks";
import AuthCard from "@/components/auth/AuthCard";
import { Alert, Field } from "@/components/ui";

function validerEmail(email: string): string | null {
  if (!email.trim()) {
    return "L’adresse email est obligatoire.";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email.trim())) {
    return "Veuillez saisir une adresse email valide.";
  }

  return null;
}

function validerMotDePasseConnexion(password: string): string | null {
  if (!password) {
    return "Le mot de passe est obligatoire.";
  }

  if (password.length < 8) {
    return "Le mot de passe doit contenir au moins 8 caractères.";
  }

  return null;
}

export default function ConnexionPage() {
  const { login } = useAuth();
  const router = useRouter();

  const { f, bind } = useForm({
    email: "",
    password: "",
  });

  const action = useAction();

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    void action.run(async () => {
      const email = f.email.trim();
      const password = f.password;

      const erreurEmail = validerEmail(email);

      if (erreurEmail) {
        throw new Error(erreurEmail);
      }

      const erreurPassword = validerMotDePasseConnexion(password);

      if (erreurPassword) {
        throw new Error(erreurPassword);
      }

      const user = await login(email, password);

      if (!user) {
        throw new Error("Impossible de récupérer les informations du compte.");
      }

      const next = new URLSearchParams(window.location.search).get("next");

      router.push(next || homeFor(user.roles));
    });
  };

  return (
    <main className="min-h-screen bg-[#090D2D] px-4 py-10 text-white sm:px-6 lg:py-16">
      <div className="mx-auto flex w-full max-w-md flex-col items-center">
        {/* LOGO */}
        <Link
          href="/"
          className="mb-7 inline-flex items-center justify-center transition-opacity hover:opacity-90"
          aria-label="Club Culture - Accueil"
        >
          <Image
            src="/images/club-culture-logo.jpg"
            alt="Club Culture"
            width={170}
            height={70}
            priority
            className="h-auto max-h-20 w-auto rounded-xl object-contain"
          />
        </Link>

        {/* FORMULAIRE */}
        <AuthCard
          title="Connexion"
          subtitle="Accédez à vos billets, événements et espace personnel."
          onSubmit={submit}
        >
          <div className="space-y-5">
            <Field
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="exemple@email.com"
              {...bind("email")}
              required
            />

            <Field
              label="Mot de passe"
              type="password"
              autoComplete="current-password"
              placeholder="Votre mot de passe"
              {...bind("password")}
              required
            />

            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-white/40">Minimum 8 caractères</p>

              <Link
                href="/mot-de-passe-oublie"
                className="text-xs font-semibold text-[#F5A623] transition-colors hover:text-[#ffc15c] hover:underline"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            <Alert>{action.error}</Alert>

            <button
              type="submit"
              className="btn w-full disabled:cursor-not-allowed disabled:opacity-50"
              disabled={action.busy}
            >
              {action.busy ? "Connexion…" : "Se connecter"}
            </button>

            <p className="text-center text-xs text-white/45">
              Pas encore de compte ?{" "}
              <Link
                href="/inscription"
                className="font-semibold text-[#F5A623] hover:text-[#ffc15c] hover:underline"
              >
                Créer un compte
              </Link>
            </p>
          </div>
        </AuthCard>

        <Link
          href="/"
          className="mt-6 text-sm text-white/45 transition-colors hover:text-white"
        >
          ← Retour à l'accueil
        </Link>
      </div>
    </main>
  );
}
