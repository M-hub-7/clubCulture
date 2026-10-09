import { prisma } from "@/app/lib/prisma";
import { stripe } from "@/app/lib/stripe";

/** Expire les holds uniquement après vérification/cancellation du PaymentIntent. */
export async function libererReservationsExpirees(): Promise<void> {
  const expired = await prisma.reservation.findMany({
    where: { statut: "ACTIVE", expireAt: { lte: new Date() } },
    take: 100,
    orderBy: { expireAt: "asc" },
  });

  for (const reservation of expired) {
    try {
      if (reservation.paymentIntentId) {
        let intent = await stripe.paymentIntents.retrieve(reservation.paymentIntentId);
        if (intent.status === "succeeded") {
          // Un paiement tardif ne doit pas consommer de places après libération du hold.
          await stripe.refunds.create({ payment_intent: intent.id }, { idempotencyKey: `club-culture-expired-refund-${intent.id}` });
        } else if (["requires_payment_method", "requires_confirmation", "requires_action", "requires_capture"].includes(intent.status)) {
          intent = await stripe.paymentIntents.cancel(intent.id);
        } else if (intent.status === "processing") {
          // Stripe ne permet pas d'annuler de façon sûre un paiement en traitement : réessayer plus tard.
          continue;
        }
      }

      await prisma.$transaction(async (tx) => {
        const changed = await tx.reservation.updateMany({
          where: { id: reservation.id, statut: "ACTIVE", expireAt: { lte: new Date() } },
          data: { statut: "EXPIREE" },
        });
        if (changed.count) {
          await tx.categorieBillet.update({
            where: { id: reservation.categorieId },
            data: { reserve: { decrement: reservation.quantite } },
          });
        }
      });
    } catch (error) {
      // Garder le hold si Stripe n'a pas confirmé l'annulation/remboursement.
      console.error(`Expiration de réservation ${reservation.id} reportée:`, error);
    }
  }
}
