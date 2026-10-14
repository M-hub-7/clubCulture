"use client";

import { useScanner } from "@/app/lib/useScanner";
import { dt } from "@/app/lib/format";
import { Icon } from "@/components/ui";
import ScanStats from "./ScanStats";
import OfflineBanner from "./OfflineBanner";
import QrReader from "./QrReader";
import ScanResult from "./ScanResult";
import ManualEntry from "./ManualEntry";

const heure = (iso: string) =>
  new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

/** Interface complète de scan : événement, liste hors ligne, caméra, résultat, synchronisation. */
export default function ScannerPanel() {
  const s = useScanner();
  const choisi = s.evenements?.find((e) => e.id === s.evId);

  return (
    <div className="mx-auto max-w-md space-y-4 px-5 py-6">
      <label className="block">
        <span className="lbl">Événement contrôlé</span>
        <select
          className="input"
          value={s.evId}
          onChange={(e) => void s.choisirEvenement(e.target.value)}
        >
          <option value="">
            {s.evenements === null ? "Chargement…" : "— Choisir un événement —"}
          </option>
          {s.evenements?.map((e) => (
            <option key={e.id} value={e.id}>
              {e.titre} · {dt(e.dateDebut)}
            </option>
          ))}
          {/* Événement mémorisé mais liste non chargée (hors ligne) */}
          {s.evId && !choisi && (
            <option value={s.evId}>{s.manifeste?.titre ?? s.evId}</option>
          )}
        </select>
      </label>

      {s.evId && (
        <div className="flex items-center gap-2 rounded-xl border border-outline-variant/50 bg-surface-card px-4 py-2 text-xs">
          <Icon
            n={s.enLigne ? "wifi" : "wifi_off"}
            className={s.enLigne ? "text-secondary" : "text-error"}
          />
          <span>
            {s.enLigne ? "En ligne" : "Hors ligne"} ·{" "}
            {s.manifeste
              ? `${s.manifeste.billets.length} billets en mémoire (${heure(s.manifeste.genereA)})`
              : "liste non téléchargée"}
          </span>
          <button
            onClick={() => void s.actualiser()}
            disabled={!s.enLigne}
            className="ml-auto text-accent-amber disabled:opacity-40"
          >
            Actualiser
          </button>
        </div>
      )}

      {s.stats && <ScanStats stats={s.stats} />}

      {s.enAttente > 0 && (
        <OfflineBanner
          count={s.enAttente}
          syncing={s.synchro}
          online={s.enLigne}
          onSync={() => void s.synchroniser()}
        />
      )}

      <QrReader onScan={(t) => void s.send(t)} />
      {s.res && <ScanResult res={s.res} />}
      <ManualEntry onSend={(t) => void s.send(t)} />

      {s.conflits.length > 0 && (
        <div className="card space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <p className="font-bold text-accent-amber">
              Conflits à la synchronisation ({s.conflits.length})
            </p>
            <button onClick={s.effacerConflits} className="text-xs text-on-surface-muted">
              Effacer
            </button>
          </div>
          <p className="text-xs text-on-surface-muted">
            Billets acceptés hors ligne mais refusés par le serveur (déjà passés à une
            autre entrée, remboursés…).
          </p>
          <ul className="divide-y divide-outline-variant/20">
            {s.conflits.map((c, i) => (
              <li key={i} className="py-2">
                <span className="font-semibold">{c.porteur ?? "Billet"}</span> ·{" "}
                {c.resultat.replaceAll("_", " ")} · {heure(c.scanneA)}
                <p className="text-xs text-on-surface-muted">{c.message}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
