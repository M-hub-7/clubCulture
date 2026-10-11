import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export const Field = ({ label, error, ...props }: FieldProps) => (
  <label className="block">
    <span className="lbl">{label}</span>
    <input className="input" {...props} />
    {error && <span className="mt-1 block text-xs text-error">{error}</span>}
  </label>
);

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string };

export const TextAreaField = ({ label, ...props }: TextAreaProps) => (
  <label className="block">
    <span className="lbl">{label}</span>
    <textarea className="input min-h-28" {...props} />
  </label>
);

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  children: ReactNode;
};

export const SelectField = ({ label, children, ...props }: SelectProps) => (
  <label className="block">
    <span className="lbl">{label}</span>
    <select className="input" {...props}>
      {children}
    </select>
  </label>
);
