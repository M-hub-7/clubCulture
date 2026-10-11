"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authAPI, saveToken, saveUser } from "@/lib/api-client";

export default function Connexion() {
  const router = useRouter();

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState("");

  async function connecter(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErreur("");

    try {
      const data = await authAPI.connecter(form);

      // Sauvegarder token et user dans localStorage
      saveToken(data.token);
      saveUser(data.user);

      // Rediriger selon le rôle
      const roles: string[] = data.user.roles;

      if (roles.includes("ADMIN")) return router.push("/admin/dashboard");
      if (roles.includes("PROMOTEUR"))
        return router.push("/promoteur/dashboard");
      if (roles.includes("AGENT")) return router.push("/agent/scan");
      if (roles.includes("PRESTATAIRE"))
        return router.push("/prestataire/dashboard");
      return router.push("/evenements");
    } catch (e: any) {
      setErreur(e.message || "Email ou mot de passe incorrect");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface-deep flex flex-col items-center justify-center px-margin-x">
      {/* Logo */}
      <div className="mb-stack-lg text-center">
        <h1 className="font-montserrat font-extrabold text-primary text-headline-xl tracking-tight">
          CLUB
        </h1>
        <h1 className="font-montserrat font-extrabold text-on-surface text-headline-xl tracking-tight -mt-3">
          CULTURE
        </h1>
        <p className="text-on-surface-muted text-sm mt-2 font-inter">
          Midnight Tropical
        </p>
      </div>

      {/* Formulaire */}
      <form onSubmit={connecter} className="w-full max-w-sm space-y-4">
        {erreur && (
          <div className="bg-error-container text-error-red rounded-xl p-4 text-sm font-inter text-center">
            {erreur}
          </div>
        )}

        {/* Email */}
        <div>
          <label className="text-label-xs text-on-surface-muted uppercase tracking-widest font-inter block mb-2">
            Email
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="ton@email.com"
            required
            className="w-full bg-surface-card border border-outline-variant text-on-surface rounded-full px-5 py-3.5 text-sm font-inter outline-none focus:border-primary transition-colors placeholder:text-on-surface-muted"
          />
        </div>

        {/* Mot de passe */}
        <div>
          <label className="text-label-xs text-on-surface-muted uppercase tracking-widest font-inter block mb-2">
            Mot de passe
          </label>
          <input
            type="password"
            value={form.password}
            onChange={(e) =>
              setForm((f) => ({ ...f, password: e.target.value }))
            }
            placeholder="••••••••"
            required
            className="w-full bg-surface-card border border-outline-variant text-on-surface rounded-full px-5 py-3.5 text-sm font-inter outline-none focus:border-primary transition-colors placeholder:text-on-surface-muted"
          />
        </div>

        {/* Bouton */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent-amber text-on-primary font-montserrat font-bold rounded-full py-4 text-base mt-2 disabled:opacity-50 transition-opacity"
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>

        {/* Lien inscription */}
        <p className="text-center text-on-surface-muted text-sm font-inter">
          Pas encore de compte ?{" "}
          <button
            type="button"
            onClick={() => router.push("/inscription")}
            className="text-primary font-semibold"
          >
            S'inscrire
          </button>
        </p>
      </form>
    </div>
  );
}
