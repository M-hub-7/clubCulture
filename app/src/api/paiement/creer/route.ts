import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { stripe } from "@/app/lib/stripe";
import { verifierRole } from "@/app/lib/verifierRole";

export async function POST(request: Request) {
  try {
    // Vérifier l'acheteur connecté via Bearer JWT ou Auth.js
    const user = await verifierRole("ACHETEUR");

    if (!user) {
      return NextResponse.json(
        { erreur: "Non authentifié ou rôle ACHETEUR requis" },
        { status: 401 },
      );
    }

    const { categorieId, quantite, nomPorteur } = await request.json();

    if (!categorieId || !quantite || !nomPorteur) {
      return NextResponse.json(
        { erreur: "Champs obligatoires manquants" },
        { status: 400 },
      );
    }

    // Vérifier que la quantité est valide
    const qte = Number(quantite);

    if (!Number.isInteger(qte) || qte <= 0) {
      return NextResponse.json(
        { erreur: "La quantité doit être un entier positif" },
        { status: 400 },
      );
    }

    // Récupérer la catégorie avec l'événement
    const categorie = await prisma.categorieBillet.findUnique({
      where: { id: categorieId },
      include: {
        evenement: {
          include: {
            promoteur: true,
          },
        },
      },
    });

    // Catégorie inexistante
    if (!categorie) {
      return NextResponse.json(
        { erreur: "Catégorie introuvable" },
        { status: 404 },
      );
    }

    // Vérifier les places disponibles
    if (categorie.vendu + qte > categorie.quantite) {
      return NextResponse.json(
        { erreur: "Plus assez de places disponibles" },
        { status: 400 },
      );
    }

    // Calculer les montants
    const montantBillets = categorie.prix * qte;
    const fraisService = Math.round(montantBillets * 0.05);
    const montantTotal = montantBillets + fraisService;

    // Créer le PaymentIntent Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: montantTotal,
      currency: "eur",
      metadata: {
        categorieId,
        quantite: String(qte),
        nomPorteur,
        acheteurId: user.id,
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
