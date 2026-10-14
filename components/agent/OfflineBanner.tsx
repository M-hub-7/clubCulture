import { Icon } from "@/components/ui";

interface OfflineBannerProps {
  count: number;
  syncing: boolean;
  online: boolean;
  onSync: () => void;
}

/** Scans faits hors ligne, en attente d'envoi au serveur. */
export default function OfflineBanner({ count, syncing, online, onSync }: OfflineBannerProps) {
  return (
    <p className="flex items-center gap-2 rounded-xl border border-outline-variant/50 bg-surface-card px-4 py-2 text-xs">
      <Icon n="cloud_upload" className="text-accent-amber" /> {count} scan(s) à
      synchroniser
      <button
        onClick={onSync}
        disabled={!online || syncing}
        className="ml-auto text-accent-amber disabled:opacity-40"
      >
        {syncing ? "Envoi…" : "Synchroniser"}
      </button>
    </p>
  );
}
