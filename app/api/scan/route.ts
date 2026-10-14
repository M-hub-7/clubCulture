import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { verifierRole } from "@/app/lib/verifierRole";
import { verifierTokenBillet } from "@/app/lib/qrcode";
import type { ResultatScan } from "@/app/generated/prisma/enums";

export async function POST(request: Request) {
  try {
    // L'agent peut être authentifié par Bearer JWT ou Auth.js
    const user = await verifierRole("AGENT");

    if (!user) {
      return NextResponse.json(
        { erreur: "Non authentifié ou rôle AGENT requis" },
        { status: 401 },
      );
    }

    const { token, evenementId, horsLigne, scanneA } = await request.json();

    // Scan rejoué après une coupure : on garde l'heure réelle du passage (48 h max)
    const dateScan = dateDuScan(horsLigne ? scanneA : undefined);

    if (!token || !evenementId) {
      return NextResponse.json(
        { erreur: "Token et evenementId requis" },
        { status: 400 },
      );
    }

    // 1. Vérifier la signature JWT du billet
    let payload: {
      billetId: string;
      evenementId: string;
    };

    try {
      payload = verifierTokenBillet(token);
    } catch (error) {
      console.warn("QR rejeté :", error instanceof Error ? error.message : error);

      return NextResponse.json({
        resultat: "INVALIDE",
        message: "QR code invalide ou expiré",
        couleur: "ROUGE",
      });
    }

    // 2. Vérifier que le billet appartient au bon événement
    if (payload.evenementId !== evenementId) {
      return NextResponse.json({
        resultat: "MAUVAIS_EVENEMENT",
        message: "Ce billet n'est pas pour cet événement",
        couleur: "ROUGE",
      });
    }

    // 3. Chercher le billet en base de données
    const billet = await prisma.billet.findFirst({
      where: {
        token,
      },
      include: {
        categorie: true,
        commande: {
          include: {
            acheteur: true,
          },
        },
      },
    });

    if (!billet) {
      return NextResponse.json({
        resultat: "INVALIDE",
        message: "Billet introuvable",
        couleur: "ROUGE",
      });
    }

    // 4. Vérifier si le billet est remboursé ou annulé
    if (
      billet.statut === "REMBOURSE" ||
      billet.statut === "ANNULE" ||
      billet.statut === "REFUSE"
    ) {
      await enregistrerScan(
        billet.id,
        user.id,
        "REMBOURSE",
        Boolean(horsLigne),
      );

      return NextResponse.json({
        resultat: "REMBOURSE",
        message: "Ce billet a été remboursé ou annulé",
        couleur: "ROUGE",
      });
    }

    // 5. Seul un billet VALIDE (validé par l'admin, non utilisé) ouvre l'entrée
    if (billet.statut !== "VALIDE" && billet.statut !== "UTILISE") {
      await enregistrerScan(billet.id, user.id, "INVALIDE", Boolean(horsLigne));

      return NextResponse.json({
        resultat: "INVALIDE",
        message: "Billet non validé ou refusé",
        couleur: "ROUGE",
      });
    }

    // 6. Passage VALIDE → UTILISE atomique : si deux agents scannent le même
    // billet en même temps, un seul obtient VALIDE.
    const entreeAccordee = await prisma.$transaction(async (tx) => {
      const maj = await tx.billet.updateMany({
        where: { id: billet.id, statut: "VALIDE" },
        data: { statut: "UTILISE" },
      });

      await tx.scan.create({
        data: {
          billetId: billet.id,
          agentId: user.id,
          resultat: maj.count === 1 ? "VALIDE" : "DEJA_UTILISE",
          horsLigne: Boolean(horsLigne),
          createdAt: dateScan,
        },
      });

      return maj.count === 1;
    });

    if (!entreeAccordee) {
      // Relu après la transaction : un autre agent a pu valider entre-temps
      const premierScan = await prisma.scan.findFirst({
        where: { billetId: billet.id, resultat: "VALIDE" },
        orderBy: { createdAt: "asc" },
      });

      return NextResponse.json({
        resultat: "DEJA_UTILISE",
        message: "Billet déjà utilisé",
        couleur: "ORANGE",
        premierScan: premierScan?.createdAt,
      });
    }

    return NextResponse.json({
      resultat: "VALIDE",
      message: "Billet valide — Entrée autorisée",
      couleur: "VERT",
      billet: {
        numero: billet.numero,
        porteur: billet.nomPorteur,
        categorie: billet.categorie.libelle,
      },
    });
  } catch (error) {
    console.error("Erreur scan:", error);

    return NextResponse.json({ erreur: "Erreur serveur" }, { status: 500 });
  }
}

function dateDuScan(scanneA: unknown): Date | undefined {
  if (typeof scanneA !== "string") return undefined;
  const d = new Date(scanneA);
  const age = Date.now() - d.getTime();
  return Number.isFinite(age) && age >= 0 && age < 48 * 3600 * 1000
    ? d
    : undefined;
}

// Fonction utilitaire pour enregistrer les scans
// des billets remboursés, annulés ou déjà utilisés.
async function enregistrerScan(
  billetId: string | null,
  agentId: string,
  resultat: ResultatScan,
  horsLigne: boolean,
) {
  if (!billetId) {
    return;
  }

  try {
    await prisma.scan.create({
      data: {
        billetId,
        agentId,
        resultat,
        horsLigne: Boolean(horsLigne),
      },
    });
  } catch (error) {
    console.error("Erreur enregistrement scan:", error);
  }
}

// GET — Statistiques de scan
export async function GET(request: Request) {
  try {
    const user = await verifierRole("AGENT");

    if (!user) {
      return NextResponse.json(
        { erreur: "Non authentifié ou rôle AGENT requis" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const evenementId = searchParams.get("evenementId");

    if (!evenementId) {
      return NextResponse.json(
        { erreur: "evenementId requis" },
        { status: 400 },
      );
    }

    const stats = await prisma.billet.groupBy({
      by: ["statut"],
      where: {
        commande: {
          evenementId,
        },
      },
      _count: {
        statut: true,
      },
    });

    const entres =
      stats.find((s) => s.statut === "UTILISE")?._count.statut || 0;

    const valides =
      stats.find((s) => s.statut === "VALIDE")?._count.statut || 0;

    // Billets qui donnent droit à l'entrée (remboursés/refusés/en attente exclus)
    const total = entres + valides;

    return NextResponse.json({
      total,
      entres,
      valides,
      tauxEntree: total > 0 ? Math.round((entres / total) * 100) : 0,
    });
  } catch (error) {
    console.error("Erreur GET scan:", error);

    return NextResponse.json({ erreur: "Erreur serveur" }, { status: 500 });
  }
}
