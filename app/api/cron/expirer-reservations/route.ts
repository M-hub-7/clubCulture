import { NextResponse } from "next/server";
import { libererReservationsExpirees } from "@/app/lib/reservations";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ erreur: "Accès interdit." }, { status: 401 });
  }
  await libererReservationsExpirees();
  return NextResponse.json({ ok: true, message: "Expiration des réservations exécutée." });
}
