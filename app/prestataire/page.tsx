"use client";

import Guard from "@/components/layout/Guard";
import { useAuth } from "@/app/lib/auth";

function PrestataireContent() {
  const { user } = useAuth();

  return (
    <div className="wrap max-w-2xl space-y-4">
      <h1 className="h1">Espace prestataire</h1>
      <div className="card space-y-2">
        <p>
          Bonjour <b>{user?.nom}</b>.
        </p>
        <p className="text-sm text-on-surface-muted">
          Communiquez cet identifiant aux organisateurs pour qu&apos;ils vous
          ajoutent comme bénéficiaire :
        </p>
        <code className="block select-all break-all rounded-xl bg-surface-deep p-3 text-sm text-accent-amber">
          {user?.id}
        </code>
        <p className="text-sm text-on-surface-muted">
          Les versements sont effectués via Stripe Connect après chaque
          événement.
        </p>
      </div>
    </div>
  );
}

export default function PrestatairePage() {
  return (
    <Guard roles={["PRESTATAIRE"]}>
      <PrestataireContent />
    </Guard>
  );
}
