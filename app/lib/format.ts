import type { Categorie, Evenement } from "@/types";

type DateInput = string | number | Date;

export const FEE_RATE = 0.05;

export const fraisDe = (amount: number): number => Math.round(amount * FEE_RATE);

/** Formate un montant exprimé en euros (prix de catégorie ou statistique en euros). */
export const eur = (amount?: number | null): string =>
  (amount ?? 0).toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/** Montants Stripe/commandes stockés en centimes EUR. */
export const eurCents = (amount?: number | null): string =>
  ((amount ?? 0) / 100).toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/** Les prix de catégories sont des euros entiers dans le schéma actuel (Int). */
export const toEurosEntiers = (value: string | number): number => {
  const parsed = Number.parseFloat(String(value).replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? Math.round(parsed) : 0;
};

/** Convertit un montant saisi en euros décimaux en centimes (notamment pour les versements fixes). */
export const eurosToCents = (value: string | number): number => {
  const parsed = Number.parseFloat(String(value).replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
};

export const dt = (d: DateInput): string => {
  const date = new Date(d);
  const jour = date.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
  const heure = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return `${jour} • ${heure}`;
};

export const dtLong = (d: DateInput): string =>
  new Date(d).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const toInputDate = (d?: DateInput | null): string => {
  if (!d) return "";
  const date = new Date(d);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

export const toIso = (value: string): string => new Date(value).toISOString();

export const minPrix = (e: Pick<Evenement, "categories">): number | null =>
  e.categories?.length ? Math.min(...e.categories.map((c) => c.prix)) : null;

export const complet = (e: Pick<Evenement, "categories">): boolean =>
  e.categories?.length > 0 && e.categories.every((c) => c.vendu >= c.quantite);

export const placesRestantes = (c: Categorie): number => Math.max(0, c.quantite - c.vendu - (c.reserve ?? 0));

export const totaux = (events: Pick<Evenement, "categories">[]) =>
  events.reduce(
    (acc, e) => {
      for (const c of e.categories ?? []) {
        acc.vendus += c.vendu;
        acc.places += c.quantite;
        acc.recettes += c.vendu * c.prix;
      }
      return acc;
    },
    { vendus: 0, places: 0, recettes: 0 },
  );
