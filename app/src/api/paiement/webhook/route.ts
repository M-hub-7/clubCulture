import { NextResponse } from "next/server";
import { stripe } from "@/app/lib/stripe";
import { prisma } from "@/app/lib/prisma";
import { genererTokenBillet } from "@/app/lib/qrcode";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (error) {
    console.error("Webhook signature invalide:", error);
    return NextResponse.json({ erreur: "Signature invalide" }, { status: 400 });
  }

  // Paiement réussi
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const { categorieId, quantite, nomPorteur, acheteurId, evenementId } =
      paymentIntent.metadata;

    const qte = parseInt(quantite);

    try {
      await prisma.$transaction(async (tx) => {
        // 1. Créer la commande
        const commande = await tx.commande.create({
          data: {
            acheteurId,
            evenementId,
            montantTotal: paymentIntent.amount,
            fraisService: Math.round((paymentIntent.amount * 0.05) / 1.05),
            statut: "PAYEE",
            stripePaymentId: paymentIntent.id,
          },
        });

        // 2. Créer les billets
        for (let i = 0; i < qte; i++) {
          const token = await genererTokenBillet(
            `${commande.id}-${i}`,
            evenementId,
          );

          await tx.billet.create({
            data: {
              commandeId: commande.id,
              categorieId,
              nomPorteur,
              token,
              numero: i + 1,
              statut: "VALIDE",
            },
          });
        }

        // 3. Incrémenter les places vendues
        await tx.categorieBillet.update({
          where: { id: categorieId },
          data: { vendu: { increment: qte } },
        });
      });

      console.log("Commande créée avec succès");
    } catch (error) {
      console.error("Erreur traitement webhook:", error);
      return NextResponse.json(
        { erreur: "Erreur traitement" },
        { status: 500 },
      );
    }
  }

  // Paiement échoué
  if (event.type === "payment_intent.payment_failed") {
    console.log("Paiement échoué:", event.data.object.id);
  }

  return NextResponse.json({ recu: true });
}

// Important — désactiver le body parser de Next.js pour Stripe
export const dynamic = "force-dynamic";
