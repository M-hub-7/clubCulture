"use client";

import type { FormEvent } from "react";
import { useForm } from "@/app/lib/hooks";
import { eurosToCents } from "@/app/lib/format";
import { Field, SelectField } from "@/components/ui";
import type { BeneficiaryPayload, TypePart } from "@/types";

interface FormState {
  userId: string;
  role: string;
  typePart: TypePart;
  valeur: string;
}

const EMPTY: FormState = {
  userId: "",
  role: "",
  typePart: "POURCENTAGE",
  valeur: "",
};

interface BeneficiaryFormProps {
  /** Renvoie true si l'ajout a réussi (le formulaire est alors vidé). */
  onAdd: (payload: BeneficiaryPayload) => Promise<boolean>;
  busy: boolean;
}

export default function BeneficiaryForm({ onAdd, busy }: BeneficiaryFormProps) {
  const { f, setF, bind } = useForm<FormState>(EMPTY);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await onAdd({
      userId: f.userId,
      role: f.role,
      typePart: f.typePart,
      // FIXE : montant saisi en euros, stocké en centimes ; POURCENTAGE : valeur en %.
      valeur: f.typePart === "FIXE" ? eurosToCents(f.valeur) : Number(f.valeur),
    });
    if (ok) setF(EMPTY);
  };

  return (
    <form
      onSubmit={submit}
      className="grid gap-3 border-t border-outline-variant/20 pt-4 md:grid-cols-5"
    >
      <div className="md:col-span-2">
        <Field
          label="ID utilisateur du bénéficiaire"
          {...bind("userId")}
          required
        />
      </div>
      <Field
        label="Rôle"
        placeholder="DJ, Technique…"
        {...bind("role")}
        required
      />
      <SelectField label="Type" {...bind("typePart")}>
        <option value="POURCENTAGE">%</option>
        <option value="FIXE">Fixe (€)</option>
      </SelectField>
      <Field
        label={f.typePart === "FIXE" ? "Montant (€)" : "Part (%)"}
        type="number"
        step="0.01"
        {...bind("valeur")}
        required
      />
      <button className="btn md:col-span-5" disabled={busy}>
        Ajouter le bénéficiaire
      </button>
    </form>
  );
}
