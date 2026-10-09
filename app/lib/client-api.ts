"use client";

const BASE_URL = "";

// ============================================================
// AUTHENTIFICATION / TOKEN
// ============================================================

function getToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("club_culture_token");
}

// Sauvegarder le token
export function saveToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem("club_culture_token", token);

  window.dispatchEvent(new Event("club-culture-auth"));
}

// Supprimer le token et l'utilisateur
export function removeToken() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem("club_culture_token");
  localStorage.removeItem("club_culture_user");

  window.dispatchEvent(new Event("club-culture-auth"));
}

// Sauvegarder l'utilisateur
export function saveUser(user: any) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem("club_culture_user", JSON.stringify(user));

  window.dispatchEvent(new Event("club-culture-auth"));
}

// Récupérer l'utilisateur
export function getUser(): any | null {
  if (typeof window === "undefined") {
    return null;
  }

  const u = localStorage.getItem("club_culture_user");

  if (!u) {
    return null;
  }

  try {
    return JSON.parse(u);
  } catch (error) {
    console.error("Erreur lors de la lecture de l'utilisateur :", error);

    localStorage.removeItem("club_culture_user");

    return null;
  }
}

// ============================================================
// FETCHER PRINCIPAL
// ============================================================

async function fetcher(path: string, options: RequestInit = {}): Promise<any> {
  const token = getToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",

    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),

    ...(options.headers || {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const contentType = res.headers.get("content-type") || "";

  let data: any = null;

  if (contentType.includes("application/json")) {
    data = await res.json();
  } else {
    const text = await res.text();

    data = text ? { message: text } : null;
  }

  if (!res.ok) {
    throw new Error(data?.erreur || data?.message || `Erreur ${res.status}`);
  }

  return data;
}

// ============================================================
// AUTH
// ============================================================

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
    fetcher("/api/auth/connexion", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  profil: {
    consulter: () =>
      fetcher("/api/auth/profil", {
        method: "GET",
      }),

    modifier: (data: { nom: string; email: string }) =>
      fetcher("/api/auth/profil", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  },
};

// ============================================================
// ÉVÉNEMENTS
// ============================================================

export const evenementsAPI = {
  // Liste publique des événements
  lister: (params?: {
    q?: string;
    ville?: string;
    style?: string;
    page?: number;
    limite?: number;
  }) => {
    const query = new URLSearchParams();

    if (params?.q) {
      query.set("q", params.q);
    }

    if (params?.ville) {
      query.set("ville", params.ville);
    }

    if (params?.style) {
      query.set("style", params.style);
    }

    if (params?.page !== undefined) {
      query.set("page", String(params.page));
    }

    if (params?.limite !== undefined) {
      query.set("limite", String(params.limite));
    }

    const queryString = query.toString();

    return fetcher(`/api/evenements${queryString ? `?${queryString}` : ""}`);
  },

  // Détail d'un événement
  detail: (id: string) => {
    if (!id) {
      throw new Error("Identifiant de l'événement manquant.");
    }

    return fetcher(`/api/evenements/${id}`);
  },

  // Créer un événement
  creer: (data: any) =>
    fetcher("/api/evenements", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Modifier un événement
  modifier: (id: string, data: any) => {
    if (!id) {
      throw new Error("Identifiant de l'événement manquant.");
    }

    return fetcher(`/api/evenements/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // Annuler un événement
  annuler: (id: string) => {
    if (!id) {
      throw new Error("Identifiant de l'événement manquant.");
    }

    return fetcher(`/api/evenements/${id}`, {
      method: "DELETE",
    });
  },

  // Publier un événement
  publier: (id: string) => {
    if (!id) {
      throw new Error("Identifiant de l'événement manquant.");
    }

    return fetcher(`/api/evenements/${id}/publier`, {
      method: "POST",
    });
  },

  // Événements du promoteur connecté
  mesEvenements: (statut?: string) => {
    const query = statut ? `?statut=${encodeURIComponent(statut)}` : "";

    return fetcher(`/api/promoteur/evenements${query}`);
  },

  // Ajouter un bénéficiaire
  ajouterBeneficiaire: (id: string, data: any) => {
    if (!id) {
      throw new Error("Identifiant de l'événement manquant.");
    }

    return fetcher(`/api/evenements/${id}/beneficiaires`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Répartir
  repartir: (id: string) => {
    if (!id) {
      throw new Error("Identifiant de l'événement manquant.");
    }

    return fetcher(`/api/evenements/${id}/repartir`, {
      method: "POST",
    });
  },
};

// ============================================================
// PAIEMENT
// ============================================================

export const paiementAPI = {
  creer: (data: {
    categorieId: string;
    quantite: number;
    nomPorteur: string;
  }) =>
    fetcher("/api/paiement/creer", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ============================================================
// BILLETS
// ============================================================

export const billetsAPI = {
  mesBillets: (evenementId?: string) => {
    const query = evenementId
      ? `?evenementId=${encodeURIComponent(evenementId)}`
      : "";

    return fetcher(`/api/billets${query}`);
  },

  detail: (id: string) => {
    if (!id) {
      throw new Error("Identifiant du billet manquant.");
    }

    return fetcher(`/api/billets/${id}`);
  },

  transferer: (
    id: string,
    data: {
      emailDestinataire: string;
      nomPorteur: string;
    },
  ) => {
    if (!id) {
      throw new Error("Identifiant du billet manquant.");
    }

    return fetcher(`/api/billets/${id}/transferer`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

// ============================================================
// SCAN
// ============================================================

export const scanAPI = {
  scanner: (data: {
    token: string;
    evenementId: string;
    horsLigne?: boolean;
  }) =>
    fetcher("/api/scan", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  stats: (evenementId: string) => {
    if (!evenementId) {
      throw new Error("Identifiant de l'événement manquant.");
    }

    return fetcher(`/api/scan?evenementId=${encodeURIComponent(evenementId)}`);
  },
};

// ============================================================
// ADMIN
// ============================================================

export const adminAPI = {
  users: {
    lister: (params?: { role?: string; q?: string }) => {
      const query = new URLSearchParams();

      if (params?.role) {
        query.set("role", params.role);
      }

      if (params?.q) {
        query.set("q", params.q);
      }

      const queryString = query.toString();

      return fetcher(`/api/admin/users${queryString ? `?${queryString}` : ""}`);
    },

    creer: (data: any) =>
      fetcher("/api/admin/users", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    detail: (id: string) => {
      if (!id) {
        throw new Error("Identifiant utilisateur manquant.");
      }

      return fetcher(`/api/admin/users/${id}`);
    },

    supprimer: (id: string) => {
      if (!id) {
        throw new Error("Identifiant utilisateur manquant.");
      }

      return fetcher(`/api/admin/users/${id}`, {
        method: "DELETE",
      });
    },

    ajouterRole: (id: string, role: string) =>
      fetcher(`/api/admin/users/${id}/roles`, {
        method: "POST",
        body: JSON.stringify({ role }),
      }),

    retirerRole: (id: string, role: string) =>
      fetcher(`/api/admin/users/${id}/roles`, {
        method: "DELETE",
        body: JSON.stringify({ role }),
      }),
  },

  evenements: {
    valider: (id: string, decision: string, raison?: string) =>
      fetcher(`/api/admin/evenements/${id}/valider`, {
        method: "PUT",
        body: JSON.stringify({
          decision,
          raison,
        }),
      }),
  },

  billets: {
    lister: (evenementId: string) =>
      fetcher(
        `/api/admin/billets?evenementId=${encodeURIComponent(evenementId)}`,
      ),

    rembourser: (id: string, raison?: string) =>
      fetcher(`/api/admin/billets/${id}/rembourser`, {
        method: "POST",
        body: JSON.stringify({
          raison,
        }),
      }),
  },
};

export const passwordAPI = {
  oublier: (email: string) =>
    fetcher("/api/auth/mot-de-passe-oublie", {
      method: "POST",
      body: JSON.stringify({
        email,
      }),
    }),

  reinitialiser: (token: string, password: string) =>
    fetcher("/api/auth/reinitialiser-mot-de-passe", {
      method: "POST",
      body: JSON.stringify({
        token,
        password,
      }),
    }),
};
