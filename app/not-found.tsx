import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-5 py-24 text-center">
      <p className="text-xs font-bold uppercase tracking-[.3em] text-accent-amber">Erreur 404</p>
      <h1 className="h1 mt-3">Cette page est introuvable</h1>
      <p className="mt-3 text-on-surface-muted">
        Le lien est peut-être erroné ou la page a été déplacée.
      </p>
      <Link href="/" className="btn mt-8">
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
