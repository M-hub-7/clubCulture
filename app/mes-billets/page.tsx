"use client";

import { useEffect, useState } from "react";

export default function MesBilletsPage() {
  const [commandes, setCommandes] = useState<any[]>([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    async function chargerBillets() {
      try {
        const res = await fetch("/api/billets");
        const data = await res.json();
        if (res.ok) setCommandes(data);
      } catch (err) {
        console.error("Erreur lors du chargement des billets:", err);
      } finally {
        setChargement(false);
      }
    }
    chargerBillets();
  }, []);

  const telechargerPDF = async (billetId: string) => {
    // Exemple de déclenchement du téléchargement PDF via votre route d'API de téléchargement
    window.open(`/api/billets/${billetId}/pdf`, "_blank");
  };

  if (chargement) return <p className="p-6">Chargement de vos billets...</p>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Mes Billets</h1>

      {commandes.length === 0 ? (
        <p className="text-gray-500">
          Vous n'avez aucun billet pour le moment.
        </p>
      ) : (
        commandes.map((commande) => (
          <div
            key={commande.id}
            className="mb-6 p-4 bg-white rounded-lg shadow border"
          >
            <h2 className="text-lg font-semibold">
              {commande.evenement?.titre}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Lieu: {commande.evenement?.lieu}
            </p>

            <div className="space-y-4">
              {commande.billets.map((billet: any) => (
                <div
                  key={billet.id}
                  className="p-4 bg-gray-50 rounded border flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{billet.categorie?.libelle}</p>

                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        billet.statut === "VALIDE"
                          ? "bg-green-100 text-green-800"
                          : billet.statut === "EN_ATTENTE_VALIDATION"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {billet.statut === "EN_ATTENTE_VALIDATION"
                        ? "En attente de validation administrative"
                        : billet.statut === "VALIDE"
                          ? "Billet validé"
                          : billet.statut === "REFUSE"
                            ? "Billet refusé"
                            : billet.statut === "REMBOURSE"
                              ? "Billet remboursé"
                              : billet.statut}
                    </span>
                  </div>

                  {/* Le bouton de téléchargement apparaît UNIQUEMENT si le billet est VALIDÉ */}
                  {billet.statut === "VALIDE" ? (
                    <button
                      onClick={() => telechargerPDF(billet.id)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 font-medium"
                    >
                      Télécharger PDF 📄
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400 italic">
                      PDF disponible après validation
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
