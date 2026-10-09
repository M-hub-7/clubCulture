"use client";

import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type DependencyList,
  type Dispatch,
  type SetStateAction,
} from "react";
import { ApiError } from "./api";

// ─── useFetch ─────────────────────────────────────────────────────────────
export interface FetchState<T> {
  data: T | null;
  error: string;
  loading: boolean;
  reload: () => Promise<void>;
  setData: Dispatch<SetStateAction<T | null>>;
}

/** Chargement de données : { data, error, loading, reload, setData }. */
export function useFetch<T>(fn: () => Promise<T>, deps: DependencyList = []): FetchState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fn());
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, error, loading, reload, setData };
}

// ─── useAction ────────────────────────────────────────────────────────────
/**
 * Exécute une action utilisateur (POST/PUT/DELETE…) en gérant :
 *  - busy    : action en cours
 *  - msg     : message de succès (ok, sinon `message` de la réponse)
 *  - error   : erreur générale
 *  - errors  : erreurs par champ (le backend renvoie `champ`)
 * `run` renvoie true si l'action a réussi.
 */
export function useAction() {
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const run = async <T,>(fn: () => Promise<T>, ok?: string): Promise<boolean> => {
    setMsg("");
    setError("");
    setErrors({});
    setBusy(true);
    try {
      const result = await fn();
      const fromServer = (result as { message?: string } | undefined)?.message;
      setMsg(ok ?? fromServer ?? "");
      return true;
    } catch (e) {
      if (e instanceof ApiError && e.champ) setErrors({ [e.champ]: e.message });
      else setError(e instanceof Error ? e.message : "Une erreur est survenue.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  return { run, msg, error, errors, busy };
}

// ─── useForm ──────────────────────────────────────────────────────────────
type FieldEvent = ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;

/** État de formulaire : bind("champ") → { value, onChange } prêt à être étalé sur un champ. */
export function useForm<T extends object>(initial: T) {
  const [f, setF] = useState<T>(initial);

  const bind = (key: keyof T & string) => ({
    value: String(f[key] ?? ""),
    onChange: (e: FieldEvent) => setF((s) => ({ ...s, [key]: e.target.value })),
  });

  return { f, setF, bind };
}
