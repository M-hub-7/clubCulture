"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { evenementsAPI, getUser, removeToken } from "@/lib/api-client";

type StatutEvenement =
  | "BROUILLON"
  | "EN_MODERATION"
  | "PUBLIE"
  | "ANNULE"
  | "TERMINE";

interface Evenement {
  id: string;
  titre: string;
  lieu: string;
  ville: string;
  dateDebut: string;
  statut: StatutEvenement;
  stats?: {
    placesVendues: number;
    placesTotal: number;
    totalRecettes: number;
    totalVentes: number;
  };
}

const STATUT_CONFIG: Record<
  StatutEvenement,
  { label: string; classes: string }
> = {
  BROUILLON: {
    label: "Brouillon",
    classes: "bg-surface-bright text-on-surface-muted",
  },
  EN_MODERATION: {
    label: "En attente",
    classes: "bg-surface-tint text-on-primary",
  },
  PUBLIE: { label: "Publié", classes: "bg-accent-green text-on-secondary" },
  ANNULE: { label: "Annulé", classes: "bg-error-container text-error" },
  TERMINE: { label: "Terminé", classes: "bg-outline text-on-surface" },
};

export default function DashboardPromoteur() {
  const router = useRouter();

  const [evenements, setEvenements] = useState<Evenement[]>([]);
  const [filtreStatut, setFiltreStatut] = useState<string>("TOUS");
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState("");
  const user = getUser();

  useEffect(() => {
    if (!user) {
      router.push("/connexion");
      return;
    }
    if (!user.roles.includes("PROMOTEUR")) {
      router.push("/evenements");
      return;
    }
    chargerEvenements();
  }, []);

  async function chargerEvenements() {
    try {
      setLoading(true);
      const data = await evenementsAPI.mesEvenements();
      setEvenements(data);
    } catch (e: any) {
      setErreur(e.message);
    } finally {
      setLoading(false);
    }
  }

  function seDeconnecter() {
    removeToken();
    router.push("/connexion");
  }

  // Filtrer les événements
  const evenementsFiltres =
    filtreStatut === "TOUS"
      ? evenements
      : evenements.filter((e) => e.statut === filtreStatut);

  // Calcul des stats globales
  const stats = {
    total: evenements.length,
    publies: evenements.filter((e) => e.statut === "PUBLIE").length,
    placesVendues: evenements.reduce(
      (a, e) => a + (e.stats?.placesVendues || 0),
      0,
    ),
    recettes: evenements.reduce((a, e) => a + (e.stats?.totalRecettes || 0), 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-deep flex items-center justify-center">
        <div className="text-primary font-montserrat text-xl animate-pulse">
          Chargement...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-deep text-on-surface font-inter">
      {/* ── Header ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant">
        <div className="flex items-center justify-between px-margin-x py-4 max-w-lg mx-auto">
          <span className="font-montserrat font-extrabold text-primary text-lg tracking-tight">
            CLUB CULTURE
          </span>
          <div className="flex items-center gap-3">
            <span className="text-on-surface-muted text-sm hidden sm:block">
              {user?.nom}
            </span>
            <button
              onClick={seDeconnecter}
              className="text-on-surface-muted text-sm border border-outline-variant rounded-full px-3 py-1"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="pt-20 pb-28 px-margin-x max-w-lg mx-auto">
        {/* ── Titre ── */}
        <div className="mt-stack-lg mb-stack-md">
          <h1 className="font-montserrat font-bold text-headline-md text-on-surface">
            Mon tableau de bord
          </h1>
          <p className="text-on-surface-muted text-sm mt-1 font-inter">
            Bienvenue, {user?.nom} 👋
          </p>
        </div>

        {erreur && (
          <div className="bg-error-container text-error rounded-xl p-4 mb-stack-md text-sm">
            {erreur}
          </div>
        )}

        {/* ── Stats globales ── */}
        <div className="grid grid-cols-2 gap-3 mb-stack-lg">
          {[
            { label: "ÉVÉNEMENTS", value: stats.total, color: "text-primary" },
            {
              label: "PUBLIÉS",
              value: stats.publies,
              color: "text-accent-green",
            },
            {
              label: "BILLETS VENDUS",
              value: stats.placesVendues,
              color: "text-primary",
            },
            {
              label: "RECETTES",
              value: `${(stats.recettes / 100).toFixed(0)} €`,
              color: "text-accent-amber",
            },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-surface-card rounded-2xl p-4">
              <div className={`font-montserrat font-bold text-3xl ${color}`}>
                {value}
              </div>
              <div className="font-inter text-label-xs text-on-surface-muted uppercase tracking-widest mt-1">
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* ── Filtres statut ── */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-stack-md scrollbar-none">
          {[
            "TOUS",
            "PUBLIE",
            "BROUILLON",
            "EN_MODERATION",
            "TERMINE",
            "ANNULE",
          ].map((s) => (
            <button
              key={s}
              onClick={() => setFiltreStatut(s)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-label-sm font-bold font-inter transition-colors ${
                filtreStatut === s
                  ? "bg-accent-amber text-on-primary"
                  : "bg-surface-card border border-outline-variant text-on-surface-muted"
              }`}
            >
              {s === "TOUS"
                ? "Tous"
                : s === "EN_MODERATION"
                  ? "En attente"
                  : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* ── Liste événements ── */}
        {evenementsFiltres.length === 0 ? (
          <div className="text-center py-stack-lg">
            <div className="text-4xl mb-3">🎤</div>
            <p className="text-on-surface-muted font-inter text-sm">
              {filtreStatut === "TOUS"
                ? "Aucun événement. Créez votre premier !"
                : `Aucun événement en statut "${filtreStatut}"`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {evenementsFiltres.map((evt) => (
              <CarteEvenement
                key={evt.id}
                evenement={evt}
                onClick={() => router.push(`/promoteur/evenements/${evt.id}`)}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Bouton créer ── */}
      <div className="fixed bottom-0 left-0 right-0 px-margin-x pb-6 pt-3 bg-surface-deep/90 backdrop-blur-md">
        <button
          onClick={() => router.push("/promoteur/creer-evenement")}
          className="w-full bg-accent-amber text-on-primary font-montserrat font-bold rounded-full py-4 text-base max-w-lg mx-auto block"
        >
          + Créer un événement
        </button>
      </div>
    </div>
  );
}

// ─── Carte événement ──────────────────────────────────────────
function CarteEvenement({
  evenement,
  onClick,
}: {
  evenement: Evenement;
  onClick: () => void;
}) {
  const config = STATUT_CONFIG[evenement.statut];
  const dateStr = new Date(evenement.dateDebut).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const tauxRemplissage = evenement.stats?.placesTotal
    ? Math.round(
        (evenement.stats.placesVendues / evenement.stats.placesTotal) * 100,
      )
    : 0;

  return (
    <div
      onClick={onClick}
      className="bg-surface-card rounded-2xl p-4 cursor-pointer hover:bg-surface-container-high transition-colors active:scale-[0.98]"
    >
      {/* Ligne 1 — Titre + Statut */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-montserrat font-bold text-on-surface text-base flex-1 leading-tight">
          {evenement.titre}
        </h3>
        <span
          className={`${config.classes} text-label-xs font-bold uppercase rounded-full px-3 py-1 flex-shrink-0`}
        >
          {config.label}
        </span>
      </div>

      {/* Ligne 2 — Lieu + Date */}
      <div className="flex items-center gap-3 text-on-surface-muted text-sm mb-3">
        <span>
          📍 {evenement.lieu}, {evenement.ville}
        </span>
        <span>•</span>
        <span>📅 {dateStr}</span>
      </div>

      {/* Ligne 3 — Stats (si disponibles) */}
      {evenement.stats && evenement.statut === "PUBLIE" && (
        <div className="border-t border-outline-variant pt-3 space-y-2">
          {/* Barre de progression */}
          <div className="flex items-center justify-between text-label-xs mb-1">
            <span className="text-on-surface-muted uppercase tracking-widest">
              {evenement.stats.placesVendues} / {evenement.stats.placesTotal}{" "}
              billets
            </span>
            <span className="text-primary font-bold">{tauxRemplissage}%</span>
          </div>
          <div className="w-full bg-surface-container rounded-full h-1.5">
            <div
              className="bg-accent-amber h-1.5 rounded-full transition-all"
              style={{ width: `${tauxRemplissage}%` }}
            />
          </div>

          {/* Recettes */}
          <div className="flex items-center justify-between mt-2">
            <span className="text-label-xs text-on-surface-muted uppercase tracking-widest">
              Recettes
            </span>
            <span className="text-accent-green font-montserrat font-bold text-sm">
              {(evenement.stats.totalRecettes / 100).toFixed(2)} €
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
