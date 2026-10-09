import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { verifierRoleUser } from "@/app/lib/getUser";
import { stripe } from "@/app/lib/stripe";

// POST — Déclencher la répartition des recettes
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await verifierRoleUser(request, "PROMOTEUR");
    if (!session) {
      return NextResponse.json({ erreur: "Accès refusé" }, { status: 403 });
    }

    const { id } = await params;

    // Récupérer l'événement avec toutes ses données
    const evenement = await prisma.evenement.findUnique({
      where: { id },
      include: {
        commandes: {
          where: { statut: "PAYEE" },
          include: { billets: true },
        },
        beneficiaires: {
          include: {
            user: { select: { stripeAccountId: true, nom: true, email: true } },
            versements: true,
          },
        },
      },
    });

    if (!evenement) {
      return NextResponse.json(
        { erreur: "Événement introuvable" },
        { status: 404 },
      );
    }

    if (evenement.promoteurId !== session.user.id) {
      return NextResponse.json({ erreur: "Accès refusé" }, { status: 403 });
    }

    // Vérifier que l'événement est terminé
    if (new Date() < new Date(evenement.dateFin)) {
      return NextResponse.json(
        {
          erreur:
            "La répartition ne peut se faire qu'après la fin de l'événement",
        },
        { status: 400 },
      );
    }

    // Vérifier qu'il n'y a pas déjà eu de répartition
    const dejaReparti = evenement.beneficiaires.some(
      (b) => b.versements.length > 0,
    );
    if (dejaReparti) {
      return NextResponse.json(
        { erreur: "La répartition a déjà été effectuée" },
        { status: 400 },
      );
    }

    // Calculer les recettes totales nettes (sans les frais plateforme)
    const recettesTotales = evenement.commandes.reduce(
      (acc, c) => acc + (c.montantTotal - c.fraisService),
      0,
    );

    if (recettesTotales === 0) {
      return NextResponse.json(
        { erreur: "Aucune recette à répartir" },
        { status: 400 },
      );
    }

    // Calculer et effectuer les versements
    const versementsEffectues = [];

    for (const beneficiaire of evenement.beneficiaires) {
      if (!beneficiaire.user.stripeAccountId) {
        console.warn(`⚠️ Pas de compte Stripe pour ${beneficiaire.user.email}`);
        continue;
      }

      // Calculer le montant du versement
      let montant: number;
      if (beneficiaire.typePart === "FIXE") {
        montant = beneficiaire.valeur;
      } else {
        montant = Math.round((recettesTotales * beneficiaire.valeur) / 100);
      }

      if (montant <= 0) continue;

      try {
        // Effectuer le transfert via Stripe Connect
        const transfert = await stripe.transfers.create({
          amount: montant,
          currency: "eur",
          destination: beneficiaire.user.stripeAccountId,
          metadata: {
            evenementId: id,
            beneficiaireId: beneficiaire.id,
            role: beneficiaire.role,
          },
        });

        // Enregistrer le versement en base
        const versement = await prisma.versement.create({
          data: {
            beneficiaireId: beneficiaire.id,
            montant,
            statut: "EFFECTUE",
            stripeTransferId: transfert.id,
          },
        });

        // Mettre à jour le statut du bénéficiaire
        await prisma.beneficiaire.update({
          where: { id: beneficiaire.id },
          data: { statut: "PAYE" },
        });

        versementsEffectues.push({
          beneficiaire: beneficiaire.user.nom,
          role: beneficiaire.role,
          montant,
          montantFormate: `${(montant / 100).toFixed(2)} €`,
          stripeTransferId: transfert.id,
        });
      } catch (error) {
        console.error(
          `Erreur versement pour ${beneficiaire.user.email}:`,
          error,
        );

        await prisma.versement.create({
          data: {
            beneficiaireId: beneficiaire.id,
            montant,
            statut: "ECHOUE",
          },
        });
      }
    }

    return NextResponse.json({
      message: "Répartition effectuée avec succès",
      recettesTotales,
      recettesTotalesFormatees: `${(recettesTotales / 100).toFixed(2)} €`,
      versementsEffectues,
      nombreVersements: versementsEffectues.length,
    });
  } catch (error) {
    console.error("Erreur répartition:", error);
    return NextResponse.json({ erreur: "Erreur serveur" }, { status: 500 });
  }
}
