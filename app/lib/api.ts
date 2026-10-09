import { session } from "./session";

/** Erreur normalisée : message lisible, code HTTP et champ fautif éventuel. */
export class ApiError extends Error {
  status: number;
  champ?: string;
  data: unknown;

  constructor(message: string, status: number, champ?: string, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.champ = champ;
    this.data = data;
  }
}

interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  /** Joindre le JWT (Authorization: Bearer). Par défaut : oui. */
  auth?: boolean;
  headers?: Record<string, string>;
}

interface ErrorBody {
  erreur?: string;
  message?: string;
  champ?: string;
}

/**
 * Client HTTP unique. Les chemins sont relatifs à /api (proxifié vers le backend).
 * Toute réponse non-2xx lève une ApiError.
 */
export async function api<T>(
  path: string,
  { method = "GET", body, auth = true, headers: extra = {} }: ApiOptions = {},
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...extra };
  const token = session.getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, {

    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = (await res.json().catch(() => ({}))) as T & ErrorBody;

  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      session.clear();
      window.dispatchEvent(new Event("club-culture-auth"));
    }
    throw new ApiError(data.erreur || data.message || "Une erreur est survenue.", res.status, data.champ, data);
  }
  return data;
}


export function getStatusClass(status: string): string {
  switch (status.toUpperCase()) {
    case "PUBLIE":
    case "CONFIRME":
    case "PAYE":
    case "VALIDE":
    case "ACTIF":
    case "TERMINE":
      return "bg-emerald-400/15 text-emerald-300";
    case "BROUILLON":
    case "EN_MODERATION":
    case "EN_ATTENTE":
    case "PENDING":
      return "bg-yellow-400/15 text-yellow-300";
    case "ANNULE":
    case "REFUSE":
    case "REJETE":
    case "REMBOURSE":
    case "ERREUR":
      return "bg-red-400/15 text-red-300";
    case "EPUISE":
    case "COMPLET":
      return "bg-orange-400/15 text-orange-300";
    default:
      return "bg-white/10 text-white/60";
  }
}
