import type { ChangeEvent } from "react";
import { Chip, Field, TextAreaField } from "@/components/ui";
import { EVENT_STYLES } from "@/app/lib/constants";

type FieldName =
  | "titre"
  | "description"
  | "lieu"
  | "ville"
  | "adresse"
  | "dateDebut"
  | "dateFin";
type Bind = (key: FieldName) => {
  value: string;
  onChange: (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => void;
};

interface EventDetailsFieldsProps {
  bind: Bind;
  styles: string[];
  onToggle: (style: string) => void;
}

/** Bloc « informations générales » du formulaire d'événement. */
export default function EventDetailsFields({
  bind,
  styles,
  onToggle,
}: EventDetailsFieldsProps) {
  return (
    <section className="card grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2">
        <Field label="Titre *" {...bind("titre")} required />
      </div>
      <div className="md:col-span-2">
        <TextAreaField label="Description" {...bind("description")} />
      </div>
      <Field label="Lieu *" {...bind("lieu")} required />
      <Field label="Ville *" {...bind("ville")} required />
      <div className="md:col-span-2">
        <Field label="Adresse" {...bind("adresse")} />
      </div>
      <Field
        label="Début *"
        type="datetime-local"
        {...bind("dateDebut")}
        required
      />
      <Field
        label="Fin *"
        type="datetime-local"
        {...bind("dateFin")}
        required
      />
      <div className="md:col-span-2">
        <span className="lbl">Styles</span>
        <div className="flex flex-wrap gap-2">
          {EVENT_STYLES.map((s) => (
            <Chip
              key={s}
              active={styles.includes(s)}
              onClick={() => onToggle(s)}
            >
              {s}
            </Chip>
          ))}
        </div>
      </div>
    </section>
  );
}
