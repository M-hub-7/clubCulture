"use client";

import { useState } from "react";
import { Empty } from "@/components/ui";
import { useFetch } from "@/app/lib/hooks";
import { adminService } from "@/app/lib/services";
import TicketFilters from "./TicketFilters";
import TicketsPanel from "./TicketsPanel";
import type { StatutBillet } from "@/types";

/** Page « Billets & remboursements » : choix de l'événement puis liste des billets. */
export default function TicketManager() {
  const events = useFetch(() => adminService.events());
  const [eventId, setEventId] = useState("");
  const [statut, setStatut] = useState<StatutBillet | "">("");

  return (
    <div className="space-y-6">
      <TicketFilters
        events={events}
        eventId={eventId}
        onEvent={setEventId}
        statut={statut}
        onStatut={setStatut}
      />
      {eventId ? (
        <TicketsPanel evenementId={eventId} statut={statut} />
      ) : (
        <Empty>Sélectionnez un événement pour voir ses billets.</Empty>
      )}
    </div>
  );
}
