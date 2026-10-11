"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authAPI, saveToken, saveUser } from "@/lib/api-client";

const ROLES = [
  {
    id: "ACHETEUR",
    label: "Acheteur",
    description: "Je veux acheter des billets et assister à des événements",
    icone: "🎫",
  },
  {
    id: "PROMOTEUR",
    label: "Promoteur",
    description: "Je veux organiser des événements et vendre des billets",
    icone: "🎤",
  },
  {
    id: "PRESTATAIRE",
    label: "Prestataire",
    description: "Je suis artiste, DJ ou technicien et je reçois des paiements",
    icone: "🎵",
  },
];

export default function Inscription() {
  const router = useRouter();

  const [etape, setEtape] = useState<1 | 2>(1);
  const [roleChoisi, setRole] = useState("");
  const [form, setForm] = useState({ email: "", nom: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState("");

  async function inscrire(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErreur("");

    try {
      const data = await authAPI.inscrire({ ...form, role: roleChoisi });

      // Auto-connexion après inscription
      const loginData = await authAPI.connecter({
        email: form.email,
        password: form.password,
      });

      saveToken(loginData.token);
      saveUser(loginData.user);

      // Rediriger selon la réponse
      router.push(data.redirection || "/evenements");
    } catch (e: any) {
      setErreur(e.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface-deep px-margin-x py-stack-lg">
      {/* Header */}
      <div className="flex items-center gap-3 mb-stack-lg max-w-sm mx-auto">
        {etape === 2 && (
          <button
            onClick={() => setEtape(1)}
            className="text-on-surface-variant text-2xl"
          >
            ←
          </button>
        )}
        <h1 className="font-montserrat font-bold text-on-surface text-xl">
          {etape === 1 ? "Rejoindre Club Culture" : "Créer mon compte"}
        </h1>
      </div>

      <div className="max-w-sm mx-auto">
        {/* Étape 1 — Choix du rôle */}
        {etape === 1 && (
          <div className="space-y-4">
            <p className="text-on-surface-muted font-inter text-sm mb-stack-md">
              Que souhaitez-vous faire sur la plateforme ?
            </p>

            {ROLES.map((role) => (
              <button
                key={role.id}
                onClick={() => {
                  setRole(role.id);
                  setEtape(2);
                }}
                className="w-full bg-surface-card border border-outline-variant hover:border-primary rounded-2xl p-5 text-left transition-colors group"
              >
                <div className="flex items-start gap-4">
                  <span className="text-3xl">{role.icone}</span>
                  <div>
                    <div className="font-montserrat font-bold text-on-surface text-base group-hover:text-primary transition-colors">
                      {role.label}
                    </div>
                    <div className="font-inter text-on-surface-muted text-sm mt-1">
                      {role.description}
                    </div>
                  </div>
                </div>
              </button>
            ))}

            <p className="text-center text-on-surface-muted text-sm font-inter mt-stack-md">
              Déjà un compte ?{" "}
              <button
                onClick={() => router.push("/connexion")}
                className="text-primary font-semibold"
              >
                Se connecter
              </button>
            </p>
          </div>
        )}

        {/* Étape 2 — Formulaire */}
        {etape === 2 && (
          <form onSubmit={inscrire} className="space-y-4">
            {/* Rôle choisi */}
            <div className="bg-surface-container rounded-xl p-3 flex items-center gap-3">
              <span className="text-xl">
                {ROLES.find((r) => r.id === roleChoisi)?.icone}
              </span>
              <span className="font-inter text-on-surface-variant text-sm">
                Compte{" "}
                <strong className="text-primary">
                  {ROLES.find((r) => r.id === roleChoisi)?.label}
                </strong>
              </span>
            </div>

            {erreur && (
              <div className="bg-error-container text-error-red rounded-xl p-4 text-sm font-inter">
                {erreur}
              </div>
            )}

            {/* Nom */}
            <div>
              <label className="text-label-xs text-on-surface-muted uppercase tracking-widest font-inter block mb-2">
                Nom complet
              </label>
              <input
                type="text"
                value={form.nom}
                onChange={(e) =>
                  setForm((f) => ({ ...f, nom: e.target.value }))
                }
                placeholder="Jean Dupont"
                required
                className="w-full bg-surface-card border border-outline-variant text-on-surface rounded-full px-5 py-3.5 text-sm font-inter outline-none focus:border-primary transition-colors placeholder:text-on-surface-muted"
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-label-xs text-on-surface-muted uppercase tracking-widest font-inter block mb-2">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
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
                placeholder="Min. 8 caractères"
                required
                minLength={8}
                className="w-full bg-surface-card border border-outline-variant text-on-surface rounded-full px-5 py-3.5 text-sm font-inter outline-none focus:border-primary transition-colors placeholder:text-on-surface-muted"
              />
            </div>

            {/* Bouton */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent-amber text-on-primary font-montserrat font-bold rounded-full py-4 text-base mt-2 disabled:opacity-50 transition-opacity"
            >
              {loading ? "Création..." : "Créer mon compte"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
