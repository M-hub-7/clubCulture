"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { evenementsAPI, getUser } from "@/app/lib/client-api";

export default function DashboardPromoteur() {
  const router = useRouter();
  const [evenements, setEvenements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState("");
  const user = getUser();

  useEffect(() => {
    if (!user || !user.roles.includes("PROMOTEUR")) {
      router.push("/connexion");
      return;
    }
    chargerEvenements();
  }, []);

  async function chargerEvenements() {
    try {
      const data = await evenementsAPI.mesEvenements();
      setEvenements(data);
    } catch (e: any) {
      setErreur(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading)
    return (
      <div className="min-h-screen bg-surface-deep flex items-center justify-center">
        <div className="text-primary font-montserrat text-xl animate-pulse">
          Chargement...
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-surface-deep text-on-surface font-inter">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-md px-margin-x py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <span className="font-montserrat font-extrabold text-primary text-xl">
            CLUB CULTURE
          </span>
          <span className="text-on-surface-variant text-sm">{user?.nom}</span>
        </div>
      </header>

      {/* Contenu */}
      <main className="pt-20 pb-24 px-margin-x max-w-lg mx-auto">
        <h1 className="font-montserrat font-bold text-headline-md text-on-surface mt-stack-lg mb-stack-md">
          Mes événements
        </h1>

        {erreur && (
          <div className="bg-error-container text-error rounded-xl p-4 mb-stack-md">
            {erreur}
          </div>
        )}

        {/* Stats globales */}
        <div className="grid grid-cols-3 gap-3 mb-stack-lg">
          {[
            { label: "ÉVÉNEMENTS", value: evenements.length },
            {
              label: "BILLETS VENDUS",
              value: evenements.reduce(
                (a, e) => a + (e.stats?.placesVendues || 0),
                0,
              ),
            },
            {
              label: "RECETTES",
              value: `${(evenements.reduce((a, e) => a + (e.stats?.totalRecettes || 0), 0) / 100).toFixed(0)}€`,
            },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="bg-surface-card rounded-xl p-3 text-center"
            >
              <div className="font-montserrat font-bold text-primary text-2xl">
                {value}
              </div>
              <div className="font-inter text-label-xs text-on-surface-muted uppercase tracking-widest mt-1">
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Liste des événements */}
        <div className="space-y-3">
          {evenements.map((evt) => (
            <div
              key={evt.id}
              className="bg-surface-card rounded-xl p-4 cursor-pointer hover:bg-surface-container-high transition-colors"
              onClick={() => router.push(`/promoteur/evenements/${evt.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-montserrat font-bold text-on-surface text-base">
                    {evt.titre}
                  </h3>
                  <p className="font-inter text-on-surface-variant text-sm mt-1">
                    {evt.lieu} • {evt.ville}
                  </p>
                  <p className="font-inter text-on-surface-muted text-sm">
                    {new Date(evt.dateDebut).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <StatutBadge statut={evt.statut} />
              </div>

              {evt.stats && (
                <div className="mt-3 pt-3 border-t border-outline-variant flex gap-4">
                  <span className="text-label-xs text-on-surface-muted uppercase">
                    {evt.stats.placesVendues}/{evt.stats.placesTotal} billets
                  </span>
                  <span className="text-label-xs text-accent-green uppercase">
                    {(evt.stats.totalRecettes / 100).toFixed(2)} €
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bouton créer */}
        <button
          onClick={() => router.push("/promoteur/creer-evenement")}
          className="fixed bottom-24 right-5 bg-accent-amber text-on-primary font-montserrat font-bold rounded-full px-6 py-3 shadow-lg"
        >
          + Créer
        </button>
      </main>
    </div>
  );
}

function StatutBadge({ statut }: { statut: string }) {
  const config: Record<string, { label: string; color: string }> = {
    BROUILLON: { label: "Brouillon", color: "bg-outline text-on-surface" },
    EN_MODERATION: {
      label: "En attente",
      color: "bg-surface-tint text-on-primary",
    },
    PUBLIE: { label: "Publié", color: "bg-accent-green text-on-secondary" },
    ANNULE: { label: "Annulé", color: "bg-error-container text-error" },
    TERMINE: {
      label: "Terminé",
      color: "bg-surface-bright text-on-surface-muted",
    },
  };
  const { label, color } = config[statut] || { label: statut, color: "" };

  return (
    <span
      className={`${color} text-label-xs uppercase font-bold rounded-full px-3 py-1`}
    >
      {label}
    </span>
  );
}
