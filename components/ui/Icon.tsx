interface IconProps {
  /** Nom de l'icône Material Symbols (ex : "search"). */
  n: string;
  className?: string;
}

export const Icon = ({ n, className = "" }: IconProps) => (
  <span className={`material-symbols-outlined ${className}`}>{n}</span>
);
