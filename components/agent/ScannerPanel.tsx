"use client";

import { useScanner } from "@/app/lib/useScanner";
import ScanStats from "./ScanStats";
import OfflineBanner from "./OfflineBanner";
import QrReader from "./QrReader";
import ScanResult from "./ScanResult";
import ManualEntry from "./ManualEntry";

/** Interface complète de scan : événement, stats, caméra, résultat, saisie manuelle. */
export default function ScannerPanel() {
  const scanner = useScanner();

  return (
    <div className="mx-auto max-w-md space-y-4 px-5 py-6">
      <input
        className="input"
        placeholder="ID de l'événement"
        value={scanner.evId}
        onChange={(e) => scanner.setEvId(e.target.value)}
        onBlur={scanner.refresh}
      />
      {scanner.stats && <ScanStats stats={scanner.stats} />}
      {scanner.queue.length > 0 && (
        <OfflineBanner count={scanner.queue.length} onSync={scanner.flush} />
      )}
      <QrReader onScan={scanner.send} />
      {scanner.res && <ScanResult res={scanner.res} />}
      <ManualEntry onSend={scanner.send} />
    </div>
  );
}
