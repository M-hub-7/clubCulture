import type { ReactNode } from "react";
import type { FetchState } from "@/app/lib/hooks";

export const Loader = () => (
  <p className="p-10 text-center text-sm text-on-surface-muted">Chargement…</p>
);

export const Empty = ({ children }: { children: ReactNode }) => (
  <p className="card text-center text-on-surface-muted">{children}</p>
);

interface AlertProps {
  children?: ReactNode;
  /** true = message de succès, sinon erreur. */
  ok?: boolean;
}

export const Alert = ({ children, ok }: AlertProps) =>
  children ? (
    <p
      className={`rounded-xl border px-4 py-3 text-sm ${
        ok
          ? "border-accent-green/50 bg-accent-green/10 text-secondary"
          : "border-error/40 bg-error-container/30 text-error"
      }`}
    >
      {children}
    </p>
  ) : null;

interface AsyncViewProps<T> {
  state: FetchState<T>;
  children: (data: T) => ReactNode;
}

/**
 * Affiche chargement / erreur puis délègue le rendu :
 * <AsyncView state={useFetch(...)}>{(data) => ...}</AsyncView>
 */
export function AsyncView<T>({ state, children }: AsyncViewProps<T>) {
  if (state.loading && !state.data) return <Loader />;
  if (state.error && !state.data) return <Alert>{state.error}</Alert>;
  return state.data ? <>{children(state.data)}</> : null;
}
