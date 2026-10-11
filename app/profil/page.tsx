"use client";

import Guard from "@/components/layout/Guard";
import { AsyncView } from "@/components/ui";
import ProfileForm from "@/components/auth/ProfileForm";
import { useFetch } from "@/app/lib/hooks";
import { authService } from "@/app/lib/services";

export default function ProfilPage() {
  const state = useFetch(authService.profile);

  return (
    <Guard>
      <div className="wrap">
        <h1 className="h1 mb-6">Mon profil</h1>
        <AsyncView state={state}>
          {(user) => <ProfileForm user={user} />}
        </AsyncView>
      </div>
    </Guard>
  );
}
