"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/app/lib/auth";
import { Icon } from "@/components/ui";

/** Retour de Stripe : /confirmation?redirect_status=succeeded|failed */
function ConfirmationContent() {
  const ok = useSearchParams().get("redirect_status") !== "failed";
  const { user } = useAuth();

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-5 py-20 text-center">
      <div
        className={`mb-6 flex h-24 w-24 items-center justify-center rounded-full border-2 ${
          ok
            ? "border-accent-green/40 text-accent-green shadow-[0_0_40px_rgba(31,169,124,.3)]"
            : "border-error/40 text-error"
        }`}
      >
        <Icon n={ok ? "check_circle" : "error"} className="!text-5xl" />
      </div>

      <h1 className="h1">{ok ? "Paiement confirmé" : "Paiement refusé"}</h1>
      <p className="mt-3 text-on-surface-muted">
        {ok ? (
          <>
            Vos billets sont générés dès réception de la confirmation de
            paiement
            {user && (
              <>
                {" "}
                pour <b className="text-on-surface">{user.email}</b>
              </>
            )}
            . Préparez-vous pour une expérience inoubliable.
          </>
        ) : (
          "Aucun montant n'a été débité. Vous pouvez réessayer."
        )}
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/mes-billets" className="btn">
          Voir mes billets
        </Link>
        <Link href="/" className="btn-ghost">
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense>
      <ConfirmationContent />
    </Suspense>
  );
}
