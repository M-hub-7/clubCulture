"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Alert, AsyncView } from "@/components/ui";
import { eventsService, ticketsService } from "@/app/lib/services";
import { useAction, useFetch } from "@/app/lib/hooks";
import { useAuth } from "@/app/lib/auth";
import CheckoutSteps from "./CheckoutSteps";
import HolderForm from "./HolderForm";
import StripePayment from "./StripePayment";
import OrderSummary from "./OrderSummary";
import type { PaymentIntentResponse } from "@/types";

interface CheckoutFlowProps {
  eventId: string;
  categoryId: string;
  qty: number;
}

/**
 * Tunnel d'achat :
 *  1. nom du porteur  →  POST /api/paiement/creer (PaymentIntent)
 *  2. paiement Stripe →  les billets sont créés par le webhook Stripe
 */
export default function CheckoutFlow({
  eventId,
  categoryId,
  qty,
}: CheckoutFlowProps) {
  const { user } = useAuth();
  const state = useFetch(() => eventsService.get(eventId), [eventId]);
  const [nom, setNom] = useState("");
  const [intent, setIntent] = useState<PaymentIntentResponse | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const action = useAction();
  const requestKey = useRef<string>(typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    if (!intent?.expireAt) { setRemainingSeconds(null); return; }
    const updateRemaining = () => setRemainingSeconds(Math.max(0, Math.ceil((new Date(intent.expireAt!).getTime() - Date.now()) / 1000)));
    updateRemaining();
    const timer = window.setInterval(updateRemaining, 1000);
    return () => window.clearInterval(timer);
  }, [intent?.expireAt]);

  // Pré-remplit le porteur avec le nom du compte.
  useEffect(() => {
    if (user && !nom) setNom(user.nom ?? "");
  }, [user, nom]);

  const startPayment = (e: FormEvent) => {
    e.preventDefault();

    void action.run(async () => {
      const nomPorteur = nom.trim();

      if (!nomPorteur) {
        throw new Error("Le nom du porteur est obligatoire.");
      }

      if (nomPorteur.length < 2) {
        throw new Error(
          "Le nom du porteur doit contenir au moins 2 caractères.",
        );
      }

      const payment = await ticketsService.createPayment({
        categorieId: categoryId,
        quantite: qty,
        nomPorteur,
      }, requestKey.current);

      if (!payment.clientSecret) {
        throw new Error("Stripe n'a pas fourni de clé de paiement.");
      }

      setIntent(payment);
    }, "");
  };
  return (
    <>
      <CheckoutSteps current={intent ? 2 : 1} />
      <AsyncView state={state}>
        {(event) => {
          const cat = event.categories.find((c) => c.id === categoryId);
          if (!cat) return <Alert>Catégorie introuvable.</Alert>;

          return (
            <div className="grid gap-6 md:grid-cols-[1fr_340px]">
              <div className="card">
                {intent ? (
                  <div className="space-y-3">
                    {remainingSeconds !== null && (
                      <div role="status" className={`rounded-xl p-3 text-sm ${remainingSeconds === 0 ? "bg-error/10 text-error" : "bg-accent-amber/10 text-on-surface"}`}>
                        {remainingSeconds === 0
                          ? "Votre réservation a expiré. Les places ont été libérées ; relancez l'achat pour réserver à nouveau."
                          : `Vos places sont réservées pendant 15 minutes. Temps restant : ${Math.floor(remainingSeconds / 60).toString().padStart(2, "0")}:${(remainingSeconds % 60).toString().padStart(2, "0")}.`}
                      </div>
                    )}
                    {remainingSeconds === 0 ? (
                      <button type="button" className="btn" onClick={() => {
                        requestKey.current = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
                        setIntent(null);
                      }}>Recommencer l'achat</button>
                    ) : <StripePayment clientSecret={intent.clientSecret} total={intent.montantTotal} />}
                  </div>
                ) : (
                  <HolderForm
                    nom={nom}
                    onNom={setNom}
                    onSubmit={startPayment}
                    error={action.error}
                  />
                )}
              </div>
              <OrderSummary event={event} cat={cat} qty={qty} intent={intent} />
            </div>
          );
        }}
      </AsyncView>
    </>
  );
}
