import type { CouleurScan, ScanResponse } from "@/types";

const COLORS: Record<CouleurScan, string> = {
  VERT: "border-secondary bg-accent-green/90 text-white",
  ORANGE: "border-accent-amber bg-accent-amber/90 text-[#452b00]",
  ROUGE: "border-error bg-error-container/95 text-error",
};

export default function ScanResult({ res }: { res: ScanResponse }) {
  const title =
    res.resultat === "VALIDE" ? "BILLET VALIDE" : res.resultat?.replaceAll("_", " ") || "ERREUR";

  return (
    <div
      role="status"
      aria-live="assertive"
      className={`rounded-xl border p-4 ${COLORS[res.couleur] ?? COLORS.ROUGE}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-head text-xl font-extrabold">{title}</p>
        {res.horsLigne && (
          <span className="rounded bg-black/20 px-2 py-0.5 text-[10px] font-bold uppercase">
            hors ligne
          </span>
        )}
      </div>
      <p className="text-sm">{res.message}</p>
      {res.billet && (
        <p className="mt-2 text-sm font-bold">
          {res.billet.porteur} · {res.billet.categorie} · n°{res.billet.numero}
        </p>
      )}
      {res.premierScan && (
        <p className="mt-1 text-xs">
          Premier passage :{" "}
          {new Date(res.premierScan).toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      )}
    </div>
  );
}
