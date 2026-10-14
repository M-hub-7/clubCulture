/**
 * Types partagés du frontend, alignés sur les réponses du backend (Prisma).
 * Montants de commande/Stripe en CENTIMES ; prix des catégories en EUROS entiers.
 * Les dates arrivent en chaînes ISO (JSON).
 */

// ─── Enums ────────────────────────────────────────────────────────────────
export type Role = "ACHETEUR" | "PROMOTEUR" | "AGENT" | "PRESTATAIRE" | "ADMIN";
export type StatutEvenement = "BROUILLON" | "EN_MODERATION" | "PUBLIE" | "ANNULE" | "TERMINE";
export type StatutBillet =
  | "EN_ATTENTE_VALIDATION"
  | "VALIDE"
  | "UTILISE"
  | "ANNULE"
  | "REMBOURSE"
  | "REFUSE";
export type StatutBeneficiaire = "EN_ATTENTE" | "PAYE" | string;
export type TypePart = "FIXE" | "POURCENTAGE";
export type CouleurScan = "VERT" | "ORANGE" | "ROUGE";
export type ResultatScan =
  | "VALIDE"
  | "INVALIDE"
  | "MAUVAIS_EVENEMENT"
  | "REMBOURSE"
  | "DEJA_UTILISE";

// ─── Utilisateurs ─────────────────────────────────────────────────────────
export interface SessionUser {
  id: string;
  email: string;
  nom: string | null;
  roles: Role[];
}

export interface Profile extends SessionUser {
  emailVerifie: boolean;
  createdAt: string;
}

export interface AdminUser extends SessionUser {
  createdAt: string;
  stats: { evenements: number; commandes: number };
}

// ─── Événements ───────────────────────────────────────────────────────────
export interface Categorie {
  id: string;
  libelle: string;
  prix: number;
  quantite: number;
  vendu: number;
  reserve?: number;
  ouverture: string;
  fermeture: string;
}

export interface Promoteur {
  id: string;
  nom: string | null;
  email?: string;
}

export interface Evenement {
  id: string;
  titre: string;
  description: string | null;
  visuel?: string | null;
  lieu: string;
  ville: string;
  adresse: string | null;
  dateDebut: string;
  dateFin: string;
  styles: string[];
  statut: StatutEvenement;
  motifModeration?: string | null;
  promoteurId: string;
  categories: Categorie[];
  promoteur?: Promoteur;
  _count?: { commandes: number; beneficiaires?: number };
}

/** GET /api/promoteur/evenements — événement + statistiques de vente */
export interface EvenementPromoteur extends Evenement {
  stats: {
    totalVentes: number;
    totalRecettes: number;
    placesVendues: number;
    placesTotal: number;
  };
}

/** GET /api/admin/evenements */
export interface EvenementAdmin extends Evenement {
  _count: { commandes: number; beneficiaires: number };
}

// ─── Billets & commandes ──────────────────────────────────────────────────
export interface Billet {
  id: string;
  numero: number;
  nomPorteur: string;
  statut: StatutBillet;
  token: string;
  qrCode?: string;
  categorie?: { libelle: string; prix: number };
}

export interface Commande {
  id: string;
  montantTotal: number;
  fraisService: number;
  statut: string;
  createdAt: string;
  evenement: Evenement;
  billets: Billet[];
}

export interface PaymentIntentResponse {
  clientSecret: string;
  montantTotal: number;
  fraisService: number;
  montantBillets: number;
  expireAt?: string;
  reservationId?: string;
}

// ─── Bénéficiaires & répartition ──────────────────────────────────────────
export interface Beneficiaire {
  id: string;
  role: string;
  typePart: TypePart;
  valeur: number;
  statut: StatutBeneficiaire;
  user: { id: string; nom: string | null; email: string };
}

export interface Versement {
  beneficiaire: string | null;
  role: string;
  montant: number;
  montantFormate: string;
  stripeTransferId: string;
}

export interface PayoutResult {
  message: string;
  recettesTotales: number;
  recettesTotalesFormatees: string;
  versementsEffectues: Versement[];
  nombreVersements: number;
}

// ─── Scan ─────────────────────────────────────────────────────────────────
export interface ScanResponse {
  resultat?: ResultatScan;
  message: string;
  couleur: CouleurScan;
  premierScan?: string;
  billet?: { numero: number; porteur: string; categorie: string };
  /** Verdict rendu sur l'appareil, sans réseau (sera confirmé à la synchronisation). */
  horsLigne?: boolean;
}

/** Événement proposé à l'agent de scan. */
export interface EvenementScan {
  id: string;
  titre: string;
  lieu: string;
  ville: string;
  dateDebut: string;
  dateFin: string;
}

export interface ScanStatsData {
  total: number;
  entres: number;
  valides: number;
  tauxEntree: number;
}

// ─── Administration ───────────────────────────────────────────────────────
export interface BilletAdmin {
  id: string;
  numero: number;
  nomPorteur: string;
  statut: StatutBillet;
  categorie: { libelle: string };
  commande: { acheteur: { nom: string | null; email: string } };
  scans: { id: string; createdAt: string; resultat: string }[];
}

/** Billet en attente de validation administrative (GET /api/billets). */
export interface BilletEnAttente {
  id: string;
  numero: number;
  nomPorteur: string;
  statut: StatutBillet;
  categorie: {
    libelle: string;
    prix: number;
    evenement: { id: string; titre: string; dateDebut: string; lieu: string };
  };
  commande: { acheteur: { id: string; nom: string | null; email: string } };
}

export interface TicketStatsData {
  total: number;
  valides: number;
  utilises: number;
  annules: number;
  rembourses: number;
}

export interface AdminTicketsResponse {
  billets: BilletAdmin[];
  stats: TicketStatsData;
}

export interface RefundResponse {
  message: string;
  montantRembourse: number;
  montantFormate: string;
  raison: string;
}

// ─── Payloads envoyés au backend ──────────────────────────────────────────
export interface RegisterPayload {
  nom: string;
  email: string;
  password: string;
  role: Role;
}

export interface CategoryPayload {
  libelle: string;
  prix: number;
  quantite: number;
  ouverture?: string;
  fermeture?: string;
}

export interface EventPayload {
  titre: string;
  description: string;
  visuel?: string;
  lieu: string;
  ville: string;
  adresse: string;
  styles: string[];
  dateDebut: string;
  dateFin: string;
  categories?: CategoryPayload[];
}

export interface BeneficiaryPayload {
  userId: string;
  role: string;
  typePart: TypePart;
  valeur: number;
}

export interface CreateUserPayload {
  nom: string;
  email: string;
  password: string;
  roles: Role[];
}

export interface PaymentPayload {
  categorieId: string;
  quantite: number;
  nomPorteur: string;
}

/** Réponse générique portant un message (succès). */
export interface MessageResponse {
  message?: string;
}
