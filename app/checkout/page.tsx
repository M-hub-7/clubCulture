"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Guard from "@/components/layout/Guard";
import CheckoutFlow from "@/components/checkout/CheckoutFlow";
import { Alert, Loader } from "@/components/ui";

/** Paramètres attendus : /checkout?ev=<événement>&cat=<catégorie>&q=<quantité> */
function CheckoutContent() {
  const params = useSearchParams();
  const eventId = params.get("ev");
  const categoryId = params.get("cat");
  const qty = Number(params.get("q"));

  if (!eventId || !categoryId || !Number.isInteger(qty) || qty <= 0) {
    return (
      <div className="wrap max-w-4xl">
        <Alert>Commande invalide : choisissez vos billets depuis la fiche de l&apos;événement.</Alert>
      </div>
    );
  }

  return (
    <div className="wrap max-w-4xl">
      <CheckoutFlow eventId={eventId} categoryId={categoryId} qty={qty} />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Guard roles={["ACHETEUR"]}>
      <Suspense fallback={<Loader />}>
        <CheckoutContent />
      </Suspense>
    </Guard>
  );
}
