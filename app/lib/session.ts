import type { SessionUser } from "@/types";

const TOKEN_KEY = "club_culture_token";
const USER_KEY = "club_culture_user";

const isBrowser = () => typeof window !== "undefined";

export const session = {
  getToken(): string | null {
    return isBrowser() ? localStorage.getItem(TOKEN_KEY) : null;
  },

  getUser(): SessionUser | null {
    if (!isBrowser()) return null;
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) ?? "null") as SessionUser | null;
    } catch {
      return null;
    }
  },

  setToken(token: string) {
    if (isBrowser()) localStorage.setItem(TOKEN_KEY, token);
  },

  setUser(user: SessionUser) {
    if (isBrowser()) localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clear() {
    if (!isBrowser()) return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};
