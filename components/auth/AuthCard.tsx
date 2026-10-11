import type { FormEventHandler, ReactNode } from "react";

interface AuthCardProps {
  title: string;
  subtitle?: string;
  width?: string;
  onSubmit: FormEventHandler<HTMLFormElement>;
  children: ReactNode;
  footer?: ReactNode;
}

/** Cadre commun des pages d'authentification. */
export default function AuthCard({
  title,
  subtitle,
  width = "max-w-md",
  onSubmit,
  children,
  footer,
}: AuthCardProps) {
  return (
    <div className={`mx-auto ${width} px-5 py-14`}>
      <h1 className="h1 mb-2">{title}</h1>
      {subtitle && <p className="mb-6 text-on-surface-muted">{subtitle}</p>}
      <form onSubmit={onSubmit} className="card mt-6 space-y-4">
        {children}
      </form>
      {footer && <div className="mt-4 text-center text-xs text-on-surface-muted">{footer}</div>}
    </div>
  );
}
