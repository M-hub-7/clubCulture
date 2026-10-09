import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { verifierRole } from "@/app/lib/verifierRole";
import { verifierTokenBillet } from "@/app/lib/qrcode";

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

    const { token, evenementId, horsLigne } = await request.json();

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
      // Affichage temporaire pour identifier la vraie cause
      // si le JWT est rejeté.
      console.error("❌ Erreur vérification JWT :", error);

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
        scans: {
          orderBy: {
            createdAt: "asc",
          },
        },
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
    if (billet.statut === "REMBOURSE" || billet.statut === "ANNULE") {
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

    // 5. Vérifier si le billet a déjà été scanné
    if (billet.scans.length > 0) {
      await enregistrerScan(
        billet.id,
        user.id,
        "DEJA_UTILISE",
        Boolean(horsLigne),
      );

      return NextResponse.json({
        resultat: "DEJA_UTILISE",
        message: "Billet déjà utilisé",
        couleur: "ORANGE",
        premierScan: billet.scans[0].createdAt,
      });
    }

    // 6. Billet valide :
    // enregistrer le scan et marquer le billet comme utilisé.
    await prisma.$transaction(async (tx) => {
      await tx.scan.create({
        data: {
          billetId: billet.id,
          agentId: user.id,
          resultat: "VALIDE",
          horsLigne: Boolean(horsLigne),
        },
      });

      await tx.billet.update({
        where: {
          id: billet.id,
        },
        data: {
          statut: "UTILISE",
        },
      });
    });

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

// Fonction utilitaire pour enregistrer les scans
// des billets remboursés, annulés ou déjà utilisés.
async function enregistrerScan(
  billetId: string | null,
  agentId: string,
  resultat: string,
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
        resultat: resultat as any,
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

    const total = stats.reduce((acc, s) => acc + s._count.statut, 0);

    const entres =
      stats.find((s) => s.statut === "UTILISE")?._count.statut || 0;

    const valides =
      stats.find((s) => s.statut === "VALIDE")?._count.statut || 0;

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
