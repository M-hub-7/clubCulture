/**
 * Couche d'accès à l'API : un objet par domaine métier.
 * Pour changer une route backend, modifiez UNIQUEMENT ce fichier.
 */
import { api } from "./api";
import type {
  AdminTicketsResponse,
  AdminUser,
  Beneficiaire,
  BeneficiaryPayload,
  Commande,
  CreateUserPayload,
  EvenementAdmin,
  Evenement,
  EvenementPromoteur,
  EventPayload,
  MessageResponse,
  PayoutResult,
  PaymentIntentResponse,
  PaymentPayload,
  Profile,
  RefundResponse,
  RegisterPayload,
  Role,
  ScanResponse,
  ScanStatsData,
  SessionUser,
  StatutBillet,
  StatutEvenement,
} from "@/types";

type QueryValue = string | number | undefined | null | false;

/** { a: "x", b: "" } → "?a=x" (les valeurs vides sont ignorées) */
const qs = (params: Record<string, QueryValue> = {}): string => {
  const entries = Object.entries(params).filter(([, v]) => v) as [string, string | number][];
  const s = new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
  return s ? `?${s}` : "";
};

// ─── Authentification ─────────────────────────────────────────────────────
export const authService = {
  login: (email: string, password: string) =>
    api<{ token: string; user: SessionUser; message: string }>("/auth/connexion", {
      method: "POST",
      body: { email, password },
      auth: false,
    }),

  register: (body: RegisterPayload) =>
    api<MessageResponse>("/auth/inscription", { method: "POST", body, auth: false }),

  forgot: (email: string) =>
    api<MessageResponse>("/auth/forget-password", { method: "POST", body: { email }, auth: false }),

  reset: (token: string, password: string) =>
    api<MessageResponse>("/auth/reset-password", {
      method: "POST",
      body: { token, password },
      auth: false,
    }),

  profile: () => api<{ user: Profile }>("/auth/profil").then((d) => d.user),

  updateProfile: (body: { nom: string; email: string }) =>
    api<{ message: string; user: Profile }>("/auth/profil", { method: "PUT", body }),
};

// ─── Événements publics ───────────────────────────────────────────────────
export const eventsService = {
  list: () =>
    api<{ evenements?: Evenement[] } | Evenement[]>("/evenements?limite=60", { auth: false }).then(
      (d) => Array.isArray(d) ? d : (d.evenements ?? []),
    ),

  get: (id: string) => api<Evenement>(`/evenements/${id}`),
};

// ─── Billets & paiement (acheteur) ────────────────────────────────────────
export const ticketsService = {
  mine: () => api<Commande[]>("/billets"),

  createPayment: (body: PaymentPayload, requestKey?: string) =>
    api<PaymentIntentResponse>("/paiement/creer", { method: "POST", body, headers: requestKey ? { "Idempotency-Key": requestKey } : {} }),
};

// ─── Promoteur ────────────────────────────────────────────────────────────
export const promoteurService = {
  mine: (statut?: StatutEvenement | "") =>
    api<EvenementPromoteur[] | { evenements?: EvenementPromoteur[] }>("/promoteur/evenements" + qs({ statut })).then(
      (d) => Array.isArray(d) ? d : (d.evenements ?? []),
    ),

  create: (body: EventPayload, soumettreAmoderation = false) =>
    api<{ evenement: Evenement }>("/evenements", {
      method: "POST",
      body: { ...body, soumettreAmoderation },
    }),

  update: (id: string, body: Partial<EventPayload>) =>
    api<{ evenement: Evenement }>(`/evenements/${id}`, { method: "PUT", body }),

  remove: (id: string) => api<MessageResponse>(`/evenements/${id}`, { method: "DELETE" }),

  /** Soumet un brouillon à la modération (BROUILLON → EN_MODERATION). */
  submit: (id: string) => api<MessageResponse>(`/evenements/${id}/publier`, { method: "POST" }),

  beneficiaries: (id: string) =>
    api<{ beneficiaires: Beneficiaire[]; totalAlloue: number }>(
      `/evenements/${id}/beneficiaires`,
    ).then((d) => d.beneficiaires),

  addBeneficiary: (id: string, body: BeneficiaryPayload) =>
    api<MessageResponse>(`/evenements/${id}/beneficiaires`, { method: "POST", body }),

  payout: (id: string) => api<PayoutResult>(`/evenements/${id}/repartir`, { method: "POST" }),
};

// ─── Agent de scan ────────────────────────────────────────────────────────
export const scanService = {
  scan: (token: string, evenementId: string, horsLigne: boolean) =>
    api<ScanResponse>("/scan", { method: "POST", body: { token, evenementId, horsLigne } }),

  stats: (evenementId: string) => api<ScanStatsData>(`/scan${qs({ evenementId })}`),
};

// ─── Administration ───────────────────────────────────────────────────────
export const adminService = {
  // Événements
  events: async (filters: { statut?: StatutEvenement | ""; q?: string } = {}) => {
    const data = await api<EvenementAdmin[] | { evenements?: EvenementAdmin[] }>(
      "/admin/evenements" + qs(filters),
    );
    return Array.isArray(data) ? data : (data.evenements ?? []);
  },

  // GET / PUT / DELETE d'un événement : fichier api/admin/evenements/[id]/valider
  event: (id: string) =>
    api<{ evenement: Evenement }>(`/admin/evenements/${id}/valider`).then((d) => d.evenement),

  decide: (id: string, decision: "PUBLIE" | "BROUILLON", raison?: string) =>
    api<MessageResponse>(`/admin/evenements/${id}/valider`, {
      method: "PUT",
      body: { decision, raison },
    }),

  deleteEvent: (id: string) =>
    api<{ success: boolean; message: string }>(`/admin/evenements/${id}/valider`, {
      method: "DELETE",
    }),

  // Utilisateurs & rôles
  users: async (filters: { q?: string; role?: Role | "" } = {}) => {
    const data = await api<AdminUser[] | { utilisateurs?: AdminUser[]; users?: AdminUser[] }>(
      "/admin/users" + qs(filters),
    );
    return Array.isArray(data) ? data : (data.utilisateurs ?? data.users ?? []);
  },

  createUser: (body: CreateUserPayload) =>
    api<MessageResponse>("/admin/users", { method: "POST", body }),

  addRole: (id: string, role: Role) =>
    api<MessageResponse>(`/admin/users/${id}/roles`, { method: "POST", body: { role } }),

  removeRole: (id: string, role: Role) =>
    api<MessageResponse>(`/admin/users/${id}/roles`, { method: "DELETE", body: { role } }),

  /** Remplace tous les rôles d'un utilisateur (PUT). */
  setRoles: (id: string, roles: Role[]) =>
    api<MessageResponse>(`/admin/users/${id}/roles`, { method: "PUT", body: { roles } }),

  // Billets & remboursements
  tickets: (evenementId: string, statut?: StatutBillet | "") =>
    api<AdminTicketsResponse>("/admin/billets" + qs({ evenementId, statut })),

  refund: (id: string, raison: string) =>
    api<RefundResponse>(`/admin/billets/${id}/rembourser`, { method: "POST", body: { raison } }),

  // Premier administrateur (clé secrète ADMIN_SECRET)
  setup: (secret: string, body: { nom: string; email: string; password: string }) =>
    api<MessageResponse>("/admin/setup", {
      method: "POST",
      body,
      auth: false,
      headers: { "x-admin-secret": secret },
    }),
};
