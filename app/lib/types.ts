export type Section =
  | "dashboard"
  | "evenements"
  | "billets"
  | "utilisateurs"
  | "configuration";

export type Role =
  | "ACHETEUR"
  | "PROMOTEUR"
  | "AGENT"
  | "PRESTATAIRE"
  | "ADMIN";

export type EventStatus =
  | "BROUILLON"
  | "EN_MODERATION"
  | "PUBLIE"
  | "ANNULE"
  | "TERMINE";

export type TicketStatus = "VALIDE" | "UTILISE" | "ANNULE" | "REMBOURSE";

export interface EventCategory {
  id: string;
  libelle: string;
  prix: number;
  quantite: number;
  vendu: number;
}

export interface AdminEvent {
  id: string;
  titre: string;
  description?: string;
  visuel?: string | null;
  lieu: string;
  ville: string;
  adresse?: string | null;
  dateDebut: string;
  dateFin: string;
  styles?: string[];
  statut: EventStatus;
  promoteurId?: string;
  promoteur?: { id?: string; nom?: string | null; email?: string };
  categories?: EventCategory[];
  createdAt?: string;
}

export interface AdminUser {
  id: string;
  email: string;
  nom: string | null;
  roles: Role[];
  createdAt: string;
  emailVerifie?: boolean;
  stats?: {
    evenements: number;
    commandes: number;
    beneficiaires?: number;
  };
  evenements?: { id: string; titre: string; statut: EventStatus }[];
  commandes?: { id: string; montantTotal: number; statut: string }[];
}

export interface AdminTicket {
  id: string;
  commandeId: string;
  categorieId: string;
  nomPorteur: string;
  token: string;
  statut: TicketStatus;
  numero: number;
  createdAt: string;
  commande?: {
    evenementId: string;
    acheteur?: { nom: string | null; email: string };
  };
  categorie?: { libelle: string };
  scans?: { createdAt: string; resultat?: string; horsLigne?: boolean }[];
}

export interface TicketStats {
  total: number;
  valides: number;
  utilises: number;
  annules: number;
  rembourses: number;
}

export interface TicketResponse {
  billets: AdminTicket[];
  stats: TicketStats;
}

export const ROLES: Role[] = [
  "ACHETEUR",
  "PROMOTEUR",
  "AGENT",
  "PRESTATAIRE",
  "ADMIN",
];
