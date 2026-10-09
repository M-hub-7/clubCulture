"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarDays, Eye, MapPin, Search } from "lucide-react";
import { AsyncView, Badge, Empty, PageHeader } from "@/components/ui";
import { useFetch } from "@/app/lib/hooks";
import { adminService } from "@/app/lib/services";
import { dtLong } from "@/app/lib/format";
import type { EvenementAdmin, StatutEvenement } from "@/types";

const STATUTS: { value: StatutEvenement | ""; label: string }[] = [
  { value: "", label: "Tous les statuts" },
  { value: "EN_MODERATION", label: "En modération" },
  { value: "PUBLIE", label: "Publiés" },
  { value: "BROUILLON", label: "Brouillons" },
];

export default function EvenementsAdmin() {
  const state = useFetch(() => adminService.events());
  const [recherche, setRecherche] = useState("");
  const [statut, setStatut] = useState<StatutEvenement | "">("");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des événements"
        subtitle="Consultez les événements et accédez à leurs détails."
      />

      <AsyncView state={state}>
        {(evenements) => {
          const liste = (evenements ?? []) as EvenementAdmin[];

          const filtres = liste.filter((event) => {
            const texte = [
              event.titre,
              event.ville,
              event.lieu,
              event.promoteur?.nom ?? "",
              event.promoteur?.email ?? "",
            ]
              .join(" ")
              .toLocaleLowerCase("fr");

            return (
              texte.includes(recherche.trim().toLocaleLowerCase("fr")) &&
              (!statut || event.statut === statut)
            );
          });

          return (
            <section className="space-y-4">
              <div className="grid gap-3 md:grid-cols-[1fr_220px]">
                <label className="relative block">
                  <Search
                    size={18}
                    aria-hidden="true"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-muted"
                  />
                  <input
                    value={recherche}
                    onChange={(event) => setRecherche(event.target.value)}
                    placeholder="Rechercher un événement, une ville, un promoteur..."
                    aria-label="Rechercher un événement"
                    className="input w-full pl-10"
                  />
                </label>

                <select
                  value={statut}
                  onChange={(event) =>
                    setStatut(event.target.value as StatutEvenement | "")
                  }
                  aria-label="Filtrer par statut"
                  className="input w-full"
                >
                  {STATUTS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between text-sm text-on-surface-muted">
                <span>
                  {filtres.length} événement{filtres.length > 1 ? "s" : ""}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setRecherche("");
                    setStatut("");
                  }}
                  className="text-accent-amber hover:underline"
                >
                  Réinitialiser les filtres
                </button>
              </div>

              {filtres.length === 0 ? (
                <Empty>Aucun événement ne correspond à ta recherche.</Empty>
              ) : (
                <div className="card overflow-x-auto !p-0">
                  <table className="w-full min-w-[900px] text-left text-sm">
                    <thead className="border-b border-outline-variant/30 text-[10px] uppercase tracking-widest text-on-surface-muted">
                      <tr>
                        <th className="p-4">Événement</th>
                        <th className="p-4">Promoteur</th>
                        <th className="p-4">Date</th>
                        <th className="p-4">Lieu</th>
                        <th className="p-4">Statut</th>
                        <th className="p-4 text-right">Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filtres.map((event) => (
                        <tr
                          key={event.id}
                          className="border-b border-outline-variant/10 transition hover:bg-surface-high"
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-high">
                                {event.visuel ? (
                                  <img
                                    src={event.visuel}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <CalendarDays
                                    size={22}
                                    aria-hidden="true"
                                    className="text-on-surface-muted"
                                  />
                                )}
                              </div>

                              <div>
                                <p className="font-semibold text-on-surface">
                                  {event.titre}
                                </p>
                                {event.styles?.length ? (
                                  <p className="mt-1 text-xs text-on-surface-muted">
                                    {event.styles.slice(0, 2).join(" • ")}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </td>

                          <td className="p-4">
                            <p className="font-medium">
                              {event.promoteur?.nom || "Non renseigné"}
                            </p>
                            <p className="mt-1 text-xs text-on-surface-muted">
                              {event.promoteur?.email || "—"}
                            </p>
                          </td>

                          <td className="whitespace-nowrap p-4">
                            {dtLong(event.dateDebut)}
                          </td>

                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <MapPin
                                size={15}
                                aria-hidden="true"
                                className="shrink-0 text-on-surface-muted"
                              />
                              <span>
                                {event.ville || event.lieu || "Non renseigné"}
                              </span>
                            </div>
                          </td>

                          <td className="p-4">
                            <Badge s={event.statut} />
                          </td>

                          <td className="p-4 text-right">
                            <Link
                              href={`/admin/evenements/${event.id}`}
                              className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/40 px-3 py-2 text-sm font-semibold transition hover:bg-surface-high"
                            >
                              <Eye size={16} aria-hidden="true" />
                              Détails
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          );
        }}
      </AsyncView>
    </div>
  );
}
