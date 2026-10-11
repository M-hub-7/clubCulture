const BASE_URL = process.env.DATABASE_URL || "";

// Récupérer le token depuis localStorage
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("club_culture_token");
}

// Sauvegarder le token
export function saveToken(token: string) {
  localStorage.setItem("club_culture_token", token);
}

// Supprimer le token (déconnexion)
export function removeToken() {
  localStorage.removeItem("club_culture_token");
  localStorage.removeItem("club_culture_user");
}

// Sauvegarder l'utilisateur
export function saveUser(user: any) {
  localStorage.setItem("club_culture_user", JSON.stringify(user));
}

// Récupérer l'utilisateur
export function getUser(): any | null {
  if (typeof window === "undefined") return null;
  const u = localStorage.getItem("club_culture_user");
  return u ? JSON.parse(u) : null;
}

// ─── Fonction principale ─────────────────────────────────────
async function fetcher(path: string, options: RequestInit = {}): Promise<any> {
  const token = getToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ erreur: "Erreur réseau" }));
    throw new Error(error.erreur || `Erreur ${res.status}`);
  }

  return res.json();
}

// ─── AUTH ────────────────────────────────────────────────────
export const authAPI = {
  inscrire: (data: {
    email: string;
    nom: string;
    password: string;
    role: string;
  }) =>
    fetcher("/api/auth/inscription", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  connecter: (data: { email: string; password: string }) =>
    fetcher("/api/connexion", { method: "POST", body: JSON.stringify(data) }),
};

// ─── ÉVÉNEMENTS ──────────────────────────────────────────────
export const evenementsAPI = {
  lister: (params?: {
    q?: string;
    ville?: string;
    style?: string;
    page?: number;
    limite?: number;
  }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetcher(`/src/api/evenements${query ? `?${query}` : ""}`);
  },

  detail: (id: string) => fetcher(`/src/api/evenements/${id}`),

  creer: (data: any) =>
    fetcher("/src/api/evenements", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  modifier: (id: string, data: any) =>
    fetcher(`/src/api/evenements/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  annuler: (id: string) =>
    fetcher(`/src/api/evenements/${id}`, { method: "DELETE" }),

  publier: (id: string) =>
    fetcher(`/src/api/evenements/${id}/publier`, { method: "POST" }),

  mesEvenements: (statut?: string) => {
    const query = statut ? `?statut=${statut}` : "";
    return fetcher(`/src/api/promoteur/evenements${query}`);
  },

  ajouterBeneficiaire: (id: string, data: any) =>
    fetcher(`/src/api/evenements/${id}/beneficiaires`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  repartir: (id: string) =>
    fetcher(`/src/api/evenements/${id}/repartir`, { method: "POST" }),
};

// ─── PAIEMENT ────────────────────────────────────────────────
export const paiementAPI = {
  creer: (data: {
    categorieId: string;
    quantite: number;
    nomPorteur: string;
  }) =>
    fetcher("/src/api/paiement/creer", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ─── BILLETS ─────────────────────────────────────────────────
export const billetsAPI = {
  mesBillets: (evenementId?: string) => {
    const query = evenementId ? `?evenementId=${evenementId}` : "";
    return fetcher(`/src/api/billets${query}`);
  },

  detail: (id: string) => fetcher(`/src/api/billets/${id}`),

  transferer: (
    id: string,
    data: { emailDestinataire: string; nomPorteur: string },
  ) =>
    fetcher(`/src/api/billets/${id}/transferer`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ─── SCAN ────────────────────────────────────────────────────
export const scanAPI = {
  scanner: (data: {
    token: string;
    evenementId: string;
    horsLigne?: boolean;
  }) =>
    fetcher("/src/api/scan", { method: "POST", body: JSON.stringify(data) }),

  stats: (evenementId: string) =>
    fetcher(`/src/api/scan?evenementId=${evenementId}`),
};

// ─── ADMIN ───────────────────────────────────────────────────
export const adminAPI = {
  users: {
    lister: (params?: { role?: string; q?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return fetcher(`/src/api/admin/users${query ? `?${query}` : ""}`);
    },
    creer: (data: any) =>
      fetcher("/src/api/admin/users", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    detail: (id: string) => fetcher(`/src/api/admin/users/${id}`),
    supprimer: (id: string) =>
      fetcher(`/src/api/admin/users/${id}`, { method: "DELETE" }),
    ajouterRole: (id: string, role: string) =>
      fetcher(`/src/api/admin/users/${id}/roles`, {
        method: "POST",
        body: JSON.stringify({ role }),
      }),
    retirerRole: (id: string, role: string) =>
      fetcher(`/src/api/admin/users/${id}/roles`, {
        method: "DELETE",
        body: JSON.stringify({ role }),
      }),
  },
  evenements: {
    valider: (id: string, decision: string, raison?: string) =>
      fetcher(`/src/api/admin/evenements/${id}/valider`, {
        method: "PUT",
        body: JSON.stringify({ decision, raison }),
      }),
  },
  billets: {
    lister: (evenementId: string) =>
      fetcher(`/src/api/admin/billets?evenementId=${evenementId}`),
    rembourser: (id: string, raison?: string) =>
      fetcher(`/src/api/admin/billets/${id}/rembourser`, {
        method: "POST",
        body: JSON.stringify({ raison }),
      }),
  },
};
