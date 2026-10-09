import { Badge } from "@/components/ui";
import type { Billet, Evenement } from "@/types";

export default function TicketCard({
  b,
  event,
}: {
  b: Billet;
  event: Evenement;
}) {
  const image = event.visuel || "/images/event-placeholder.jpg";

  return (
    <div className="card overflow-hidden p-0">
      <div className="relative h-40 w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={`Visuel de ${event.titre}`}
          className="h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-[#090D2D] via-transparent to-transparent" />

        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="font-head text-lg font-bold text-white">
            {event.titre}
          </h3>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 p-5 text-center">
        <div className="flex w-full items-center justify-between">
          <span className="chip !text-accent-amber">
            {b.categorie?.libelle}
          </span>

          <Badge s={b.statut} />
        </div>

        {b.qrCode && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={b.qrCode}
            alt="QR code du billet"
            className={`h-44 w-44 rounded-lg bg-white p-2 ${
              b.statut !== "VALIDE" ? "opacity-40" : ""
            }`}
          />
        )}

        <div>
          <p className="font-semibold">{b.nomPorteur}</p>

          <p className="text-xs text-on-surface-muted">Billet n°{b.numero}</p>
        </div>

        <div className="w-full border-t border-white/10 pt-3 text-xs text-on-surface-muted">
          {event.lieu}, {event.ville}
        </div>
      </div>
    </div>
  );
}
