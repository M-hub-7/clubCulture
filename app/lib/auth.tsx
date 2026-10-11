"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { authService } from "./services";
import { session } from "./session";
import type { Role, SessionUser } from "@/types";

interface AuthContextValue {
  user: SessionUser | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<SessionUser>;
  logout: () => void;
  update: (user: SessionUser) => void;
  has: (role: Role) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth doit être utilisé dans <AuthProvider>.");
  }

  return context;
}

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      setUser(session.getUser());
    };

    sync();
    setReady(true);

    window.addEventListener("club-culture-auth", sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener("club-culture-auth", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const update = (nextUser: SessionUser) => {
    session.setUser(nextUser);
    setUser(nextUser);
  };

  const login = async (email: string, password: string) => {
    const data = await authService.login(email, password);

    session.setToken(data.token);
    update(data.user);

    return data.user;
  };

  const logout = () => {
    session.clear();
    setUser(null);
  };

  const has = (role: Role) => {
    return Boolean(user?.roles?.includes(role));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        ready,
        login,
        logout,
        update,
        has,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}