import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { stripe } from "@/app/lib/stripe";
import { verifierRole } from "@/app/lib/verifierRole";
import { libererReservationsExpirees } from "@/app/lib/reservations";

const DUREE_RESERVATION_MS = 15 * 60 * 1000;
const FRAIS_SERVICE_RATE = 0.05;

export async function POST(request: Request) {
  try {
    const user = await verifierRole("ACHETEUR");
    if (!user) return NextResponse.json({ erreur: "Non authentifié ou rôle ACHETEUR requis" }, { status: 401 });

    const body = await request.json();
    const categorieId = String(body.categorieId ?? "");
    const nomPorteur = String(body.nomPorteur ?? "").trim();
    const qte = Number(body.quantite);
    const requestKey = request.headers.get("Idempotency-Key")?.trim() || null;

    if (!categorieId || nomPorteur.length < 2 || nomPorteur.length > 120 || !Number.isInteger(qte) || qte < 1 || qte > 10) {
      return NextResponse.json({ erreur: "Catégorie, nom du porteur et quantité valide (1 à 10) obligatoires." }, { status: 400 });
    }

    await libererReservationsExpirees();

    if (requestKey) {
      const existing = await prisma.reservation.findUnique({ where: { requestKey } });
      if (existing) {
        if (existing.acheteurId !== user.id || existing.categorieId !== categorieId || existing.quantite !== qte || existing.nomPorteur !== nomPorteur) {
          return NextResponse.json({ erreur: "Cette clé d'idempotence est déjà associée à une autre commande." }, { status: 409 });
        }
        if (existing.statut === "ACTIVE" && existing.expireAt > new Date()) {
          if (existing.paymentIntentId) {
            const [pi, category] = await Promise.all([
              stripe.paymentIntents.retrieve(existing.paymentIntentId),
              prisma.categorieBillet.findUnique({ where: { id: existing.categorieId } }),
            ]);
            if (!category) return NextResponse.json({ erreur: "Catégorie introuvable." }, { status: 404 });
            const subtotalCents = category.prix * existing.quantite * 100;
            const feeCents = Math.round(subtotalCents * FRAIS_SERVICE_RATE);
            return NextResponse.json({ clientSecret: pi.client_secret, montantTotal: pi.amount, fraisService: feeCents, montantBillets: subtotalCents, expireAt: existing.expireAt.toISOString(), reservationId: existing.id });
          }
          // Une tentative précédente a pu atteindre Stripe sans recevoir sa réponse.
          // On réutilise le même identifiant d'idempotence Stripe pour ne pas créer un second PaymentIntent.
          const category = await prisma.categorieBillet.findUnique({ where: { id: existing.categorieId } });
          if (!category) return NextResponse.json({ erreur: "Catégorie introuvable." }, { status: 404 });
          const subtotalCents = category.prix * existing.quantite * 100;
          const feeCents = Math.round(subtotalCents * FRAIS_SERVICE_RATE);
          const totalCents = subtotalCents + feeCents;
          const pi = await stripe.paymentIntents.create({
            amount: totalCents,
            currency: "eur",
            metadata: { reservationId: existing.id, categorieId: existing.categorieId, quantite: String(existing.quantite), nomPorteur: existing.nomPorteur, acheteurId: existing.acheteurId, evenementId: existing.evenementId },
            description: `Club Culture — ${category.libelle} × ${existing.quantite}`,
          }, { idempotencyKey: `club-culture-payment-${existing.id}` });
          await prisma.reservation.update({ where: { id: existing.id }, data: { paymentIntentId: pi.id } });
          return NextResponse.json({ clientSecret: pi.client_secret, montantTotal: totalCents, fraisService: feeCents, montantBillets: subtotalCents, expireAt: existing.expireAt.toISOString(), reservationId: existing.id });
        }
        return NextResponse.json({ erreur: "La réservation liée à cette demande a expiré. Relancez l'achat." }, { status: 409 });
      }
    }

    const categorie = await prisma.categorieBillet.findUnique({
      where: { id: categorieId },
      include: { evenement: true },
    });
    if (!categorie) return NextResponse.json({ erreur: "Catégorie introuvable." }, { status: 404 });
    if (categorie.evenement.statut !== "PUBLIE") return NextResponse.json({ erreur: "Cet événement n'est pas disponible à la vente." }, { status: 409 });
    const now = new Date();
    if (categorie.ouverture > now || categorie.fermeture <= now || categorie.evenement.dateFin <= now) {
      return NextResponse.json({ erreur: "La vente de cette catégorie n'est pas ouverte." }, { status: 409 });
    }
    if (!Number.isSafeInteger(categorie.prix) || categorie.prix < 0) return NextResponse.json({ erreur: "Prix de billet invalide." }, { status: 400 });

    const expireAt = new Date(Date.now() + DUREE_RESERVATION_MS);
    const reservation = await prisma.$transaction(async (tx) => {
      const current = await tx.categorieBillet.findUnique({ where: { id: categorieId } });
      if (!current) throw new Error("CATEGORY_NOT_FOUND");
      const stock = await tx.categorieBillet.updateMany({
        where: {
          id: categorieId,
          vendu: current.vendu,
          reserve: current.reserve,
          quantite: { gte: current.vendu + current.reserve + qte },
        },
        data: { reserve: { increment: qte } },
      });
      if (stock.count !== 1) throw new Error("STOCK_UNAVAILABLE");
      return tx.reservation.create({
        data: { acheteurId: user.id, categorieId, evenementId: categorie.evenementId, quantite: qte, nomPorteur, expireAt, requestKey },
      });
    }, { isolationLevel: "Serializable" });
    // La base conserve le prix en euros entiers. Stripe exige un montant en centimes.
    const montantBillets = categorie.prix * qte * 100;
    const fraisService = Math.round(montantBillets * FRAIS_SERVICE_RATE);
    const montantTotal = montantBillets + fraisService;
    if (!Number.isSafeInteger(montantTotal) || montantTotal < 50) {
      await prisma.$transaction(async (tx) => {
        await tx.reservation.update({ where: { id: reservation.id }, data: { statut: "ANNULEE" } });
        await tx.categorieBillet.update({ where: { id: categorieId }, data: { reserve: { decrement: qte } } });
      });
      return NextResponse.json({ erreur: "Le montant minimum d'un paiement Stripe est de 0,50 €. Vérifiez le prix du billet." }, { status: 400 });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: montantTotal,
      currency: "eur",
      metadata: {
        reservationId: reservation.id,
        categorieId,
        quantite: String(qte),
        nomPorteur,
        acheteurId: user.id,
        evenementId: categorie.evenementId,
      },
      description: `Club Culture — ${categorie.libelle} × ${qte}`,
    }, { idempotencyKey: `club-culture-payment-${reservation.id}` });

    await prisma.reservation.update({ where: { id: reservation.id }, data: { paymentIntentId: paymentIntent.id } });
    return NextResponse.json({ clientSecret: paymentIntent.client_secret, montantTotal, fraisService, montantBillets, expireAt: expireAt.toISOString(), reservationId: reservation.id });
  } catch (error) {
    // Si Stripe a pu recevoir la requête, conserver le hold jusqu'à son expiration :
    // un retry avec la même Idempotency-Key récupérera le même PaymentIntent.
    const message = error instanceof Error && error.message === "STOCK_UNAVAILABLE"
      ? "Il n'y a plus assez de places disponibles."
      : "Impossible de créer le paiement pour le moment.";
    const status = error instanceof Error && error.message === "STOCK_UNAVAILABLE" ? 409 : 500;
    console.error("Erreur paiement/creer:", error);
    return NextResponse.json({ erreur: message }, { status });
  }
}
