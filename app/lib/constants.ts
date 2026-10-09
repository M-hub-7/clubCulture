import type { Role } from "@/types";

export const ALL_ROLES: Role[] = ["ACHETEUR", "PROMOTEUR", "AGENT", "PRESTATAIRE", "ADMIN"];

/** Rôles que l'on peut choisir soi-même à l'inscription (cf. backend). */
export const SIGNUP_ROLES: Role[] = ["ACHETEUR", "PROMOTEUR", "PRESTATAIRE"];

export const EVENT_STYLES = [
  "Afrobeats",
  "Dancehall",
  "Amapiano",
  "Zouk",
  "Hip-hop",
  "Live DJ",
  "Gratuit",
];

export const BILLET_STATUTS = ["VALIDE", "UTILISE", "ANNULE", "REMBOURSE"] as const;

/** Page d'accueil après connexion, selon le rôle le plus « élevé ». */
export function homeFor(roles: Role[]): string {
  if (roles.includes("ADMIN")) return "/admin";
  if (roles.includes("AGENT")) return "/agent/scan";
  if (roles.includes("PROMOTEUR")) return "/promoteur/dashboard";
  if (roles.includes("PRESTATAIRE")) return "/prestataire";
  return "/evenements";
}
