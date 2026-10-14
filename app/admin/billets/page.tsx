"use client";

import { useState } from "react";
import { Alert, AsyncView, Badge, Empty, PageHeader } from "@/components/ui";
import TicketManager from "@/components/admin/TicketManager";
import { useFetch } from "@/app/lib/hooks";
import { adminService } from "@/app/lib/services";

const HEAD = "p-4";

export default function AdminBilletsPage() {
  const state = useFetch(adminService.pendingTickets);
  const [actionEnCours, setActionEnCours] = useState<string | null>(null);
  const [message, setMessage] = useState<{ texte: string; ok: boolean }>();

  const agir = async (id: string, action: "valider" | "refuser") => {
    if (
      action === "refuser" &&
      !confirm("Refuser ce billet et rembourser intégralement la commande ?")
    )
      return;

    setActionEnCours(id);
    setMessage(undefined);
    try {
      const res =
        action === "valider"
          ? await adminService.validateTicket(id)
          : await adminService.refuseTicket(id);
      setMessage({
        texte:
          res.message ??
          (action === "valider" ? "Billet validé." : "Billet refusé."),
        ok: true,
      });
      await state.reload();
    } catch (e) {
      setMessage({
        texte: e instanceof Error ? e.message : "Action impossible.",
        ok: false,
      });
    } finally {
      setActionEnCours(null);
    }
  };

  return (
    <div className="space-y-10">
      <section className="space-y-6">
        <PageHeader
          title="Billets en attente de validation"
          subtitle="Le QR code n'est émis qu'après validation. Un refus rembourse la commande."
        />
        <Alert ok={message?.ok}>{message?.texte}</Alert>
        <AsyncView state={state}>
          {(billets) =>
            billets.length === 0 ? (
              <Empty>Aucun billet en attente de validation.</Empty>
            ) : (
              <div className="card overflow-x-auto !p-0">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-outline-variant/30 text-[10px] uppercase tracking-widest text-on-surface-muted">
                    <tr>
                      <th className={HEAD}>Événement</th>
                      <th className={HEAD}>Catégorie</th>
                      <th className={HEAD}>Acheteur / porteur</th>
                      <th className={HEAD}>Statut</th>
                      <th className={`${HEAD} text-right`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billets.map((b) => (
                      <tr
                        key={b.id}
                        className="border-b border-outline-variant/10"
                      >
                        <td className="p-4 font-semibold">
                          {b.categorie.evenement.titre}
                        </td>
                        <td className="p-4">
                          {b.categorie.libelle} ({b.categorie.prix} €)
                        </td>
                        <td className="p-4">
                          <p>{b.nomPorteur || b.commande.acheteur.nom}</p>
                          <p className="text-xs text-on-surface-muted">
                            {b.commande.acheteur.email}
                          </p>
                        </td>
                        <td className="p-4">
                          <Badge s={b.statut} />
                        </td>
                        <td className="whitespace-nowrap p-4 text-right">
                          <div className="inline-flex gap-2">
                            <button
                              className="btn"
                              disabled={actionEnCours === b.id}
                              onClick={() => agir(b.id, "valider")}
                            >
                              Valider
                            </button>
                            <button
                              className="btn-ghost"
                              disabled={actionEnCours === b.id}
                              onClick={() => agir(b.id, "refuser")}
                            >
                              Refuser
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </AsyncView>
      </section>

      <section className="space-y-6">
        <PageHeader title="Billets & remboursements" />
        <TicketManager />
      </section>
    </div>
  );
}
