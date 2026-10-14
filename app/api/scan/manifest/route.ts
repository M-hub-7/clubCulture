import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { verifierRole } from "@/app/lib/verifierRole";

/**
 * GET — Liste des billets d'un événement pour le contrôle hors ligne.
 *
 * Chaque billet est identifié par l'empreinte SHA-256 de son QR (jamais le QR
 * lui-même) : l'appareil de l'agent vérifie un QR en le hachant, sans pouvoir
 * en fabriquer un à partir de la liste.
 */
export async function GET(request: Request) {
  try {
    const agent = await verifierRole("AGENT");
    if (!agent) {
      return NextResponse.json(
        { erreur: "Non authentifié ou rôle AGENT requis" },
        { status: 401 },
      );
    }

    const evenementId = new URL(request.url).searchParams.get("evenementId");
    if (!evenementId) {
      return NextResponse.json(
        { erreur: "evenementId requis" },
        { status: 400 },
      );
    }

    const evenement = await prisma.evenement.findUnique({
      where: { id: evenementId },
      select: { id: true, titre: true, statut: true },
    });
    if (!evenement || evenement.statut !== "PUBLIE") {
      return NextResponse.json(
        { erreur: "Événement introuvable ou non publié" },
        { status: 404 },
      );
    }

    // Les billets EN_ATTENTE_VALIDATION n'ont pas encore de QR : exclus
    const billets = await prisma.billet.findMany({
      where: {
        commande: { evenementId },
        statut: { in: ["VALIDE", "UTILISE", "REMBOURSE", "ANNULE", "REFUSE"] },
      },
      select: {
        token: true,
        statut: true,
        numero: true,
        nomPorteur: true,
        categorie: { select: { libelle: true } },
      },
    });

    return NextResponse.json({
      evenementId,
      titre: evenement.titre,
      genereA: new Date().toISOString(),
      billets: billets.map((b) => ({
        h: createHash("sha256").update(b.token).digest("hex"),
        statut: b.statut,
        numero: b.numero,
        porteur: b.nomPorteur,
        categorie: b.categorie.libelle,
      })),
    });
  } catch (error) {
    console.error("Erreur GET scan/manifest:", error);
    return NextResponse.json({ erreur: "Erreur serveur" }, { status: 500 });
  }
}
