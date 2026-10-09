"use client";

import { useEffect, useState } from "react";

interface BilletAdmin {
  id: string;
  nomPorteur: string;
  statut: string;
  categorie: {
    libelle: string;
    prix: number;
    evenement: { titre: string };
  };
  commande: {
    acheteur: { email: string; nom: string };
    created: string;
  };
}

export default function AdminBilletsPage() {
  const [billets, setBillets] = useState<BilletAdmin[]>([]);
  const [chargement, setChargement] = useState(true);
  const [actionEnCours, setActionEnCours] = useState<string | null>(null);

  const chargerBillets = async () => {
    setChargement(true);
    try {
      const res = await fetch("/api/admin/billets");
      const data = await res.json();
      if (res.ok) setBillets(data.billets || []);
    } catch (e) {
      console.error("Erreur chargement billets", e);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    chargerBillets();
  }, []);

  const validerBillet = async (id: string) => {
    setActionEnCours(id);

    try {
      const res = await fetch(`/api/admin/billets/${id}/valider`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.erreur || "Erreur lors de la validation.");
      }

      await chargerBillets();
      alert(data.message || "Billet validé.");
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Erreur lors de la validation.",
      );
    } finally {
      setActionEnCours(null);
    }
  };

  const refuserBillet = async (id: string) => {
    if (
      !confirm(
        "Voulez-vous vraiment refuser ce billet et rembourser l'acheteur ?",
      )
    )
      return;
    setActionEnCours(id);
    try {
      const res = await fetch(`/api/admin/billets/${id}/refuser`, {
        method: "POST",
      });
      if (res.ok) {
        await chargerBillets();
      } else {
        alert("Erreur lors du refus");
      }
    } finally {
      setActionEnCours(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        Validation Administrative des Billets
      </h1>

      {chargement ? (
        <p>Chargement des demandes...</p>
      ) : billets.length === 0 ? (
        <p className="text-gray-500">Aucun billet en attente de validation.</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b text-sm font-semibold">
                <th className="p-4">Événement</th>
                <th className="p-4">Catégorie</th>
                <th className="p-4">Acheteur / Porteur</th>
                <th className="p-4">Statut</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {billets.map((b) => (
                <tr key={b.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium">
                    {b.categorie.evenement.titre}
                  </td>
                  <td className="p-4">
                    {b.categorie.libelle} ({b.categorie.prix} €)
                  </td>
                  <td className="p-4">
                    <div>{b.nomPorteur || b.commande.acheteur?.nom}</div>
                    <div className="text-xs text-gray-500">
                      {b.commande.acheteur?.email}
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 text-xs rounded font-semibold ${
                        b.statut === "EN_ATTENTE_VALIDATION"
                          ? "bg-yellow-100 text-yellow-800"
                          : b.statut === "VALIDE"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {b.statut}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {b.statut === "EN_ATTENTE_VALIDATION" && (
                      <>
                        <button
                          disabled={actionEnCours === b.id}
                          onClick={() => validerBillet(b.id)}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                        >
                          Valider
                        </button>
                        <button
                          disabled={actionEnCours === b.id}
                          onClick={() => refuserBillet(b.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
                        >
                          Refuser
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
