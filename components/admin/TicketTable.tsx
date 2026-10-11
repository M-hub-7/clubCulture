import { Badge, Empty } from "@/components/ui";
import { dtLong } from "@/app/lib/format";
import type { BilletAdmin } from "@/types";

interface TicketTableProps {
  billets: BilletAdmin[];
  onRefund: (billet: BilletAdmin) => void;
  busy: boolean;
}

export default function TicketTable({
  billets,
  onRefund,
  busy,
}: TicketTableProps) {
  if (!billets.length) return <Empty>Aucun billet.</Empty>;

  return (
    <div className="card overflow-x-auto !p-0">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-outline-variant/30 text-[10px] uppercase tracking-widest text-on-surface-muted">
          <tr>
            <th className="p-4">Porteur</th>
            <th className="p-4">Acheteur</th>
            <th className="p-4">Catégorie</th>
            <th className="p-4">Statut</th>
            <th className="p-4">Dernier scan</th>
            <th className="p-4" />
          </tr>
        </thead>
        <tbody>
          {billets.map((b) => (
            <tr key={b.id} className="border-b border-outline-variant/10">
              <td className="p-4 font-semibold">
                {b.nomPorteur}{" "}
                <span className="text-xs text-on-surface-muted">
                  n°{b.numero}
                </span>
              </td>
              <td className="p-4">
                <p>{b.commande.acheteur.nom}</p>
                <p className="text-xs text-on-surface-muted">
                  {b.commande.acheteur.email}
                </p>
              </td>
              <td className="p-4">{b.categorie.libelle}</td>
              <td className="p-4">
                <Badge s={b.statut} />
              </td>
              <td className="p-4 text-xs">
                {b.scans[0] ? dtLong(b.scans[0].createdAt) : "—"}
              </td>
              <td className="p-4 text-right">
                {(b.statut === "VALIDE" || b.statut === "ANNULE") && (
                  <button
                    disabled={busy}
                    onClick={() => onRefund(b)}
                    className="text-xs text-error hover:underline"
                  >
                    Rembourser
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
