"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { evenementsAPI } from "@/lib/api-client";

export default function CreerEvenement() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState("");

  const [form, setForm] = useState({
    titre: "",
    description: "",
    lieu: "",
    ville: "",
    adresse: "",
    dateDebut: "",
    dateFin: "",
    styles: [] as string[],
  });

  const [categories, setCategories] = useState([
    { libelle: "Standard", prix: 0, quantite: 0 },
  ]);

  const stylesDisponibles = [
    "Afrobeats",
    "Amapiano",
    "Dancehall",
    "Zouk",
    "Afropop",
    "Caribbean",
  ];

  function toggleStyle(style: string) {
    setForm((f) => ({
      ...f,
      styles: f.styles.includes(style)
        ? f.styles.filter((s) => s !== style)
        : [...f.styles, style],
    }));
  }

  function updateCategorie(i: number, field: string, value: any) {
    setCategories((cats) =>
      cats.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)),
    );
  }

  async function soumettre() {
    try {
      setLoading(true);
      setErreur("");

      const data = await evenementsAPI.creer({
        ...form,
        categories: categories.map((c) => ({
          ...c,
          prix: c.prix * 100, // convertir en centimes
        })),
      });

      router.push(`/promoteur/evenements/${data.evenement.id}`);
    } catch (e: any) {
      setErreur(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface-deep text-on-surface font-inter">
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-md px-margin-x py-4">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button
            onClick={() => router.back()}
            className="text-on-surface-variant"
          >
            ←
          </button>
          <h1 className="font-montserrat font-bold text-on-surface text-lg">
            Créer un événement
          </h1>
        </div>
      </header>

      <main className="pt-20 pb-32 px-margin-x max-w-lg mx-auto space-y-stack-md">
        {erreur && (
          <div className="bg-error-container text-error rounded-xl p-4 mt-stack-lg">
            {erreur}
          </div>
        )}

        {/* Infos de base */}
        <Section titre="Informations">
          <Input
            label="Titre de l'événement"
            value={form.titre}
            onChange={(v) => setForm((f) => ({ ...f, titre: v }))}
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(v) => setForm((f) => ({ ...f, description: v }))}
          />
          <Input
            label="Lieu"
            value={form.lieu}
            onChange={(v) => setForm((f) => ({ ...f, lieu: v }))}
          />
          <Input
            label="Ville"
            value={form.ville}
            onChange={(v) => setForm((f) => ({ ...f, ville: v }))}
          />
          <Input
            label="Adresse complète"
            value={form.adresse}
            onChange={(v) => setForm((f) => ({ ...f, adresse: v }))}
          />
        </Section>

        {/* Dates */}
        <Section titre="Dates">
          <Input
            label="Date de début"
            type="datetime-local"
            value={form.dateDebut}
            onChange={(v) => setForm((f) => ({ ...f, dateDebut: v }))}
          />
          <Input
            label="Date de fin"
            type="datetime-local"
            value={form.dateFin}
            onChange={(v) => setForm((f) => ({ ...f, dateFin: v }))}
          />
        </Section>

        {/* Styles musicaux */}
        <Section titre="Styles musicaux">
          <div className="flex flex-wrap gap-2">
            {stylesDisponibles.map((style) => (
              <button
                key={style}
                onClick={() => toggleStyle(style)}
                className={`px-4 py-2 rounded-full text-label-sm font-bold transition-colors ${
                  form.styles.includes(style)
                    ? "bg-accent-amber text-on-primary"
                    : "bg-surface-card border border-outline-variant text-on-surface-variant"
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </Section>

        {/* Catégories de billets */}
        <Section titre="Catégories de billets">
          {categories.map((cat, i) => (
            <div
              key={i}
              className="bg-surface-container rounded-xl p-4 space-y-3"
            >
              <Input
                label="Nom de la catégorie"
                value={cat.libelle}
                onChange={(v) => updateCategorie(i, "libelle", v)}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Prix (€)"
                  type="number"
                  value={String(cat.prix)}
                  onChange={(v) => updateCategorie(i, "prix", Number(v))}
                />
                <Input
                  label="Quantité"
                  type="number"
                  value={String(cat.quantite)}
                  onChange={(v) => updateCategorie(i, "quantite", Number(v))}
                />
              </div>
            </div>
          ))}
          <button
            onClick={() =>
              setCategories((c) => [
                ...c,
                { libelle: "", prix: 0, quantite: 0 },
              ])
            }
            className="w-full py-3 border border-dashed border-outline-variant rounded-xl text-on-surface-muted text-sm"
          >
            + Ajouter une catégorie
          </button>
        </Section>
      </main>

      {/* Bouton soumettre */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-surface/90 backdrop-blur-md">
        <button
          onClick={soumettre}
          disabled={loading}
          className="w-full bg-accent-amber text-on-primary font-montserrat font-bold rounded-full py-4 disabled:opacity-50"
        >
          {loading ? "Création..." : "Créer l'événement"}
        </button>
      </div>
    </div>
  );
}

// ─── Composants réutilisables ─────────────────────────────────
function Section({
  titre,
  children,
}: {
  titre: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-stack-lg">
      <h2 className="font-montserrat font-bold text-primary text-label-sm uppercase tracking-widest mb-stack-sm">
        {titre}
      </h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="text-label-xs text-on-surface-muted uppercase tracking-widest block mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-surface-card border border-outline-variant text-on-surface rounded-xl px-4 py-3 text-sm focus:border-primary outline-none"
      />
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-label-xs text-on-surface-muted uppercase tracking-widest block mb-1">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full bg-surface-card border border-outline-variant text-on-surface rounded-xl px-4 py-3 text-sm focus:border-primary outline-none resize-none"
      />
    </div>
  );
}
