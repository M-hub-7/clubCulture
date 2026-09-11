import { NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { stripe } from "@/app/lib/stripe";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ erreur: "Non authentifié" }, { status: 401 });
    }

    const { categorieId, quantite, nomPorteur } = await request.json();

    if (!categorieId || !quantite || !nomPorteur) {
      return NextResponse.json(
        { erreur: "Champs obligatoires manquants" },
        { status: 400 },
      );
    }

    // Récupérer la catégorie avec l'événement
    const categorie = await prisma.categorieBillet.findUnique({
      where: { id: categorieId },
      include: {
        evenement: {
          include: { promoteur: true },
        },
      },
    });

    if (!categorie) {
      return NextResponse.json(
        { erreur: "Catégorie introuvable" },
        { status: 404 },
      );
    }

    // Vérifier les places disponibles
    if (categorie.vendu + quantite > categorie.quantite) {
      return NextResponse.json(
        { erreur: "Plus assez de places disponibles" },
        { status: 400 },
      );
    }

    // Calculer les montants
    const montantBillets = categorie.prix * quantite;
    const fraisService = Math.round(montantBillets * 0.05); // 5%
    const montantTotal = montantBillets + fraisService;

    // Créer le PaymentIntent Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: montantTotal,
      currency: "eur",
      metadata: {
        categorieId,
        quantite: String(quantite),
        nomPorteur,
        acheteurId: session.user.id,
        evenementId: categorie.evenementId,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      montantTotal,
      fraisService,
      montantBillets,
    });
  } catch (error) {
    console.error("Erreur paiement/creer:", error);
    return NextResponse.json({ erreur: "Erreur serveur" }, { status: 500 });
  }
}
