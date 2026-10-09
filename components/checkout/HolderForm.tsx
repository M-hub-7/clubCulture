import type { FormEventHandler } from "react";
import { Alert, Field } from "@/components/ui";

interface HolderFormProps {
  nom: string;
  onNom: (value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  error?: string;
}

export default function HolderForm({ nom, onNom, onSubmit, error }: HolderFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h1 className="font-head text-2xl font-bold">Vos informations</h1>
      <Field
        label="Nom du porteur des billets"
        value={nom}
        onChange={(e) => onNom(e.target.value)}
        required
      />
      <Alert>{error}</Alert>
      <button className="btn w-full">Continuer vers le paiement</button>
    </form>
  );
}
