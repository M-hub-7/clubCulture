"use client";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div className="mx-auto max-w-xl px-5 py-24 text-center">
      <h1 className="h1">Une erreur est survenue</h1>
      <p className="mt-3 text-on-surface-muted">{error.message || "Veuillez réessayer."}</p>
      <button onClick={reset} className="btn mt-8">
        Réessayer
      </button>
    </div>
  );
}
