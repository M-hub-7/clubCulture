import { redirect } from "next/navigation";

/** Ancienne URL conservée pour les liens déjà partagés. */
export default function AncienneCreationEvenementPage() {
  redirect("/promoteur/evenements/nouveau");
}
