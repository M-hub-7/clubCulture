import Stripe from "stripe";

let client: Stripe | null = null;

function getStripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY manquante dans .env");
    }
    // Version d'API par défaut du SDK stripe installé (celle de ses types).
    client = new Stripe(key);
  }
  return client;
}

/** Client Stripe instancié à la première utilisation (le build n'exige pas la clé). */
export const stripe = new Proxy({} as Stripe, {
  get: (_target, prop) => Reflect.get(getStripe(), prop),
});
