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
    <div className={`rounded-xl border p-4 ${COLORS[res.couleur] ?? COLORS.ROUGE}`}>
      <p className="font-head text-xl font-extrabold">{title}</p>
      <p className="text-sm">{res.message}</p>
      {res.billet && (
        <p className="mt-2 text-sm font-bold">
          {res.billet.porteur} · {res.billet.categorie} · n°{res.billet.numero}
        </p>
      )}
    </div>
  );
}
