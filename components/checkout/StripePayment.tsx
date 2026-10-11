"use client";

import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { useAction } from "@/app/lib/hooks";
import { eurCents } from "@/app/lib/format";
import { Alert } from "@/components/ui";

// La clé publique est accessible au navigateur uniquement avec NEXT_PUBLIC_.
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

const appearance = {
  theme: "night" as const,
  variables: {
    colorPrimary: "#F2A93B",
    colorBackground: "#0E1230",
  },
};

function PayButton({ total }: { total: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const action = useAction();

  const pay = () =>
    action.run(async () => {
      if (!stripe) {
        throw new Error("Stripe n'est pas encore chargé.");
      }

      if (!elements) {
        throw new Error("Le formulaire de paiement n'est pas disponible.");
      }

      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/confirmation`,
        },
      });

      if (error) {
        throw new Error(
          error.message || "Le paiement n'a pas pu être effectué.",
        );
      }
    });

  return (
    <>
      {" "}
      <PaymentElement />{" "}
      <div className="mt-3">
        {" "}
        <Alert>{action.error}</Alert>{" "}
      </div>
      <button
        type="button"
        className="btn mt-5 w-full"
        disabled={!stripe || !elements || action.busy}
        onClick={pay}
      >
        {action.busy ? "Paiement…" : `Payer ${eurCents(total)}`}{" "}
      </button>
    </>
  );
}

interface StripePaymentProps {
  clientSecret: string;
  total: number;
}

export default function StripePayment({
  clientSecret,
  total,
}: StripePaymentProps) {
  if (!publishableKey || !stripePromise) {
    return (
      <Alert>
        Le paiement est temporairement indisponible : la clé publique Stripe est
        absente. Configure NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY dans .env.local,
        puis redémarre le serveur.{" "}
      </Alert>
    );
  }

  return (
    <>
      {" "}
      <h1 className="mb-4 font-head text-2xl font-bold">Paiement sécurisé </h1>
      <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
        <PayButton total={total} />
      </Elements>
    </>
  );
}
