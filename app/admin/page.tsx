"use client";

import Link from "next/link";
import { AsyncView, Empty, PageHeader } from "@/components/ui";
import AdminKpis from "@/components/admin/AdminKpis";
import ModerationTable from "@/components/admin/ModerationTable";
import { useFetch } from "@/app/lib/hooks";
import { adminService } from "@/app/lib/services";

export default function AdminHomePage() {
  const state = useFetch(() => adminService.events());

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administration"
        subtitle="Vue d'ensemble de la plateforme."
      />
      <AsyncView state={state}>
        {(events) => {
          const pending = events.filter((e) => e.statut === "EN_MODERATION");
          return (
            <>
              <AdminKpis events={events} />
              <div className="flex items-center justify-between">
                <h2 className="font-head text-xl font-bold">À modérer</h2>
                <Link
                  href="/admin/moderation"
                  className="text-xs text-accent-amber"
                >
                  Tout voir →
                </Link>
              </div>
              {pending.length ? (
                <ModerationTable
                  events={pending.slice(0, 5)}
                  onSelect={() => {}}
                />
              ) : (
                <Empty>Aucun événement en attente.</Empty>
              )}
            </>
          );
        }}
      </AsyncView>
    </div>
  );
}
