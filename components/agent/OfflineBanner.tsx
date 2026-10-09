import { Icon } from "@/components/ui";

interface OfflineBannerProps {
  count: number;
  onSync: () => void;
}

export default function OfflineBanner({ count, onSync }: OfflineBannerProps) {
  return (
    <p className="flex items-center gap-2 rounded-xl border border-outline-variant/50 bg-surface-card px-4 py-2 text-xs">
      <Icon n="cloud_off" className="text-error" /> {count} scan(s) en attente
      <button onClick={onSync} className="ml-auto text-accent-amber">
        Synchroniser
      </button>
    </p>
  );
}
