import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { verifierRoleUser } from "@/app/lib/getUser";
import { stripe } from "@/app/lib/stripe";

/** Billets qui génèrent encore une recette (les remboursés/refusés en sont exclus). */
const STATUTS_ENCAISSES = ["VALIDE", "UTILISE"] as const;

/**
 * Réserve le versement d'un bénéficiaire : crée un Versement EN_ATTENTE
 * s'il n'en a aucun EN_ATTENTE/EFFECTUE. Transaction sérialisable : deux
 * requêtes simultanées ne peuvent pas réserver le même bénéficiaire.
 */
async function reserverVersement(beneficiaireId: string, montant: number) {
  try {
    return await prisma.$transaction(
      async (tx) => {
        const existant = await tx.versement.findFirst({
          where: { beneficiaireId, statut: { in: ["EN_ATTENTE", "EFFECTUE"] } },
        });
        if (existant) return null;
        return tx.versement.create({
          data: { beneficiaireId, montant, statut: "EN_ATTENTE" },
        });
      },
      { isolationLevel: "Serializable" },
    );
  } catch {
    // Conflit de sérialisation : une autre requête traite ce bénéficiaire
    return null;
  }
}

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

    const evenement = await prisma.evenement.findUnique({
      where: { id },
      include: {
        commandes: {
          where: { statut: "PAYEE" },
          include: {
            billets: {
              where: { statut: { in: [...STATUTS_ENCAISSES] } },
              include: { categorie: { select: { prix: true } } },
            },
          },
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

    if (evenement.statut !== "PUBLIE" && evenement.statut !== "TERMINE") {
      return NextResponse.json(
        { erreur: "Seul un événement publié ou terminé peut être réparti" },
        { status: 400 },
      );
    }

    if (new Date() < new Date(evenement.dateFin)) {
      return NextResponse.json(
        {
          erreur:
            "La répartition ne peut se faire qu'après la fin de l'événement",
        },
        { status: 400 },
      );
    }

    // Recettes nettes en centimes : prix (euros) des billets encore encaissés, hors frais
    const recettesTotales = evenement.commandes.reduce(
      (acc, c) =>
        acc + c.billets.reduce((s, b) => s + b.categorie.prix * 100, 0),
      0,
    );

    if (recettesTotales === 0) {
      return NextResponse.json(
        { erreur: "Aucune recette à répartir" },
        { status: 400 },
      );
    }

    const parts = evenement.beneficiaires.map((b) => ({
      beneficiaire: b,
      montant:
        b.typePart === "FIXE"
          ? b.valeur
          : Math.floor((recettesTotales * b.valeur) / 100),
    }));

    const totalParts = parts.reduce((acc, p) => acc + p.montant, 0);
    if (totalParts > recettesTotales) {
      return NextResponse.json(
        {
          erreur: `Les parts (${(totalParts / 100).toFixed(2)} €) dépassent les recettes (${(recettesTotales / 100).toFixed(2)} €)`,
        },
        { status: 400 },
      );
    }

    const versementsEffectues = [];
    const ignores: { beneficiaire: string | null; raison: string }[] = [];

    for (const { beneficiaire, montant } of parts) {
      if (montant <= 0) continue;

      if (!beneficiaire.user.stripeAccountId) {
        ignores.push({
          beneficiaire: beneficiaire.user.nom,
          raison: "Pas de compte Stripe connecté",
        });
        continue;
      }

      const versement = await reserverVersement(beneficiaire.id, montant);
      if (!versement) {
        ignores.push({
          beneficiaire: beneficiaire.user.nom,
          raison: "Déjà versé ou en cours",
        });
        continue;
      }

      try {
        // Clé d'idempotence = id du versement : un rejeu ne crée pas de second virement
        const transfert = await stripe.transfers.create(
          {
            amount: montant,
            currency: "eur",
            destination: beneficiaire.user.stripeAccountId,
            metadata: {
              evenementId: id,
              beneficiaireId: beneficiaire.id,
              versementId: versement.id,
              role: beneficiaire.role,
            },
          },
          { idempotencyKey: `versement-${versement.id}` },
        );

        await prisma.$transaction([
          prisma.versement.update({
            where: { id: versement.id },
            data: { statut: "EFFECTUE", stripeTransferId: transfert.id },
          }),
          prisma.beneficiaire.update({
            where: { id: beneficiaire.id },
            data: { statut: "PAYE" },
          }),
        ]);

        versementsEffectues.push({
          beneficiaire: beneficiaire.user.nom,
          role: beneficiaire.role,
          montant,
          montantFormate: `${(montant / 100).toFixed(2)} €`,
          stripeTransferId: transfert.id,
        });
      } catch (error) {
        console.error(`Erreur versement ${versement.id}:`, error);

        // ECHOUE libère le bénéficiaire : une nouvelle répartition pourra réessayer
        await prisma.versement.update({
          where: { id: versement.id },
          data: { statut: "ECHOUE" },
        });
        ignores.push({
          beneficiaire: beneficiaire.user.nom,
          raison: "Virement Stripe refusé",
        });
      }
    }

    return NextResponse.json({
      message: ignores.length
        ? "Répartition partielle"
        : "Répartition effectuée avec succès",
      recettesTotales,
      recettesTotalesFormatees: `${(recettesTotales / 100).toFixed(2)} €`,
      versementsEffectues,
      nombreVersements: versementsEffectues.length,
      ignores,
    });
  } catch (error) {
    console.error("Erreur répartition:", error);
    return NextResponse.json({ erreur: "Erreur serveur" }, { status: 500 });
  }
}
