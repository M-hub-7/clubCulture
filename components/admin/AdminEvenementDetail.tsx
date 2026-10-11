"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import EventReviewPanel from "@/components/admin/EventReviewPanel";

interface AdminEvenementDetailProps {
  evenementId: string;
}

export default function AdminEvenementDetail({
  evenementId,
}: AdminEvenementDetailProps) {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href="/admin/evenements"
        className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-muted transition hover:text-on-surface"
      >
        <ArrowLeft size={17} aria-hidden="true" />
        Retour à la liste des événements
      </Link>

      <div>
        <h1 className="font-head text-2xl font-extrabold">
          Détails de l’événement
        </h1>
        <p className="mt-1 text-sm text-on-surface-muted">
          Consultez les informations et gérez la décision de modération.
        </p>
      </div>

      <EventReviewPanel
        key={evenementId}
        id={evenementId}
        onChanged={() => router.refresh()}
        onDeleted={() => router.push("/admin/evenements")}
      />
    </div>
  );
}
