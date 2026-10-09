import { Alert } from "@/components/ui";
import type { Evenement } from "@/types";

export default function EventHero({ e }: { e: Evenement }) {
  return (
    <>
      <div className="flex h-56 items-end rounded-xl bg-gradient-to-br from-accent-green/40 via-surface-card to-accent-amber/40 p-5">
        <div className="flex flex-wrap gap-2">
          {e.styles?.map((s) => (
            <span key={s} className="chip">
              {s}
            </span>
          ))}
        </div>
      </div>
      <h1 className="h1">{e.titre}</h1>
      {e.statut !== "PUBLIE" && (
        <Alert>Cet événement n&apos;est pas encore publié (statut : {e.statut}).</Alert>
      )}
    </>
  );
}
