"use client";

import type { FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { authService } from "@/app/lib/services";
import { validerMotDePasse } from "@/app/lib/password";
import { useAction, useForm } from "@/app/lib/hooks";

import AuthCard from "@/components/auth/AuthCard";
import RoleSelector from "@/components/auth/RoleSelector";
import { Alert, Field } from "@/components/ui";

import type { RegisterPayload } from "@/types";

export default function InscriptionPage() {
  const router = useRouter();

  const { f, setF, bind } = useForm<RegisterPayload & { confirmation: string }>(
    {
      nom: "",
      email: "",
      password: "",
      confirmation: "",
      role: "ACHETEUR",
    },
  );

  const action = useAction();

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    void action.run(async () => {
      /*
       * VALIDATION DU NOM
       */
      if (!f.nom.trim()) {
        throw new Error("Le nom complet est obligatoire.");
      }

      if (f.nom.trim().length < 3) {
        throw new Error("Le nom complet doit contenir au moins 3 caractères.");
      }

      /*
       * VALIDATION EMAIL
       */
      if (!f.email.trim()) {
        throw new Error("L'adresse email est obligatoire.");
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(f.email.trim())) {
        throw new Error("Veuillez saisir une adresse email valide.");
      }

      /*
       * VALIDATION MOT DE PASSE
       *
       * La fonction validerMotDePasse vérifie :
       * - 8 caractères minimum
       * - minuscule
       * - majuscule
       * - chiffre
       * - caractère spécial
       * - nom interdit
       * - identifiant email interdit
       */
      const passwordCheck = validerMotDePasse(f.password, f.nom, f.email);

      if (!passwordCheck.valide) {
        throw new Error(
          passwordCheck.erreur ||
            "Le mot de passe ne respecte pas les règles de sécurité.",
        );
      }

      /*
       * CONFIRMATION
       */
      if (!f.confirmation) {
        throw new Error("Veuillez confirmer votre mot de passe.");
      }

      if (f.password !== f.confirmation) {
        throw new Error("Les deux mots de passe ne correspondent pas.");
      }

      /*
       * ROLE
       */
      const rolesAutorises = ["ACHETEUR", "PROMOTEUR", "PRESTATAIRE"];

      if (!rolesAutorises.includes(f.role)) {
        throw new Error("Veuillez sélectionner un rôle valide.");
      }

      /*
       * ENVOI AU BACKEND
       */
      const { confirmation: _confirmation, ...payload } = f;

      await authService.register(payload);

      /*
       * REDIRECTION
       */
      router.push("/connexion?inscription=ok");
    });
  };

  return (
    <main className="min-h-screen bg-[#090D2D] px-4 py-10 text-white sm:px-6 lg:py-14">
      <div className="mx-auto flex w-full max-w-lg flex-col items-center">
        {/* LOGO */}
        <Link
          href="/"
          aria-label="Club Culture - Accueil"
          className="mb-7 inline-flex transition-opacity hover:opacity-90"
        >
          <Image
            src="/images/club-culture-logo.jpg"
            alt="Club Culture"
            width={180}
            height={75}
            priority
            className="h-auto max-h-20 w-auto rounded-xl object-contain"
          />
        </Link>

        {/* FORMULAIRE */}
        <AuthCard
          title="Créer un compte"
          subtitle="Rejoignez Club Culture pour acheter, organiser ou proposer vos services."
          width="max-w-lg"
          onSubmit={submit}
          footer={
            <>
              Déjà inscrit ?{" "}
              <Link
                href="/connexion"
                className="font-semibold text-[#F5A623] hover:text-[#ffc15c] hover:underline"
              >
                Connexion
              </Link>
            </>
          }
        >
          <div className="space-y-5">
            {/* ROLE */}
            <div>
              <RoleSelector
                value={f.role}
                onChange={(role) =>
                  setF({
                    ...f,
                    role,
                  })
                }
              />

              {action.errors.role && (
                <p className="mt-2 text-xs text-red-300">
                  {action.errors.role}
                </p>
              )}
            </div>

            {/* NOM */}
            <Field
              label="Nom complet"
              placeholder="Votre nom complet"
              {...bind("nom")}
              error={action.errors.nom}
              required
            />

            {/* EMAIL */}
            <Field
              label="Email"
              type="email"
              placeholder="exemple@email.com"
              autoComplete="email"
              {...bind("email")}
              error={action.errors.email}
              required
            />

            {/* MOT DE PASSE */}
            <div>
              <Field
                label="Mot de passe"
                type="password"
                placeholder="Votre mot de passe"
                autoComplete="new-password"
                {...bind("password")}
                error={action.errors.password}
                required
              />

              <div className="mt-2 rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs font-semibold text-white/70">
                  Règles du mot de passe
                </p>

                <ul className="mt-2 space-y-1 text-xs text-white/45">
                  <li>• Au moins 8 caractères</li>
                  <li>• Une lettre majuscule</li>
                  <li>• Une lettre minuscule</li>
                  <li>• Un chiffre</li>
                  <li>• Un caractère spécial</li>
                  <li>• Votre nom est interdit</li>
                  <li>• Votre identifiant email est interdit</li>
                </ul>
              </div>
            </div>

            {/* CONFIRMATION */}
            <Field
              label="Confirmer le mot de passe"
              type="password"
              placeholder="Répétez votre mot de passe"
              autoComplete="new-password"
              {...bind("confirmation")}
              error={action.errors.confirmation}
              required
            />

            {/* BOUTON */}
            <button
              type="submit"
              className="btn w-full disabled:cursor-not-allowed disabled:opacity-50"
              disabled={action.busy}
            >
              {action.busy ? "Création du compte…" : "Créer mon compte"}
            </button>
          </div>
        </AuthCard>

        {/* VALIDATION / ERREUR EN BAS DE PAGE */}
        <div className="mt-6 w-full">
          {action.error && (
            <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-center text-sm text-red-200">
              {action.error}
            </div>
          )}
        </div>

        {/* RETOUR */}
        <Link
          href="/"
          className="mt-5 text-sm text-white/40 transition hover:text-white/80"
        >
          ← Retour à l'accueil
        </Link>
      </div>
    </main>
  );
}
