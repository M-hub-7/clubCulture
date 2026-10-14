import { NextResponse } from "next/server";
import { getUser } from "@/app/lib/getUser";
import { prisma } from "@/app/lib/prisma";
import { genererQRCode } from "@/app/lib/qrcode";

// GET — Commandes et billets de l'utilisateur connecté (QR uniquement si validé)
export async function GET(request: Request) {
  try {
    const session = await getUser(request);
    if (!session) {
      return NextResponse.json({ erreur: "Non authentifié" }, { status: 401 });
    }

    const commandes = await prisma.commande.findMany({
      where: { acheteurId: session.user.id },
      include: {
        evenement: {
          select: {
            id: true,
            titre: true,
            visuel: true,
            lieu: true,
            ville: true,
            dateDebut: true,
            dateFin: true,
          },
        },
        billets: {
          select: {
            id: true,
            numero: true,
            nomPorteur: true,
            statut: true,
            token: true,
            categorie: { select: { libelle: true, prix: true } },
          },
          orderBy: { numero: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Les billets non validés portent un jeton provisoire "PENDING-…" : pas de QR.
    const resultat = await Promise.all(
      commandes.map(async (commande) => ({
        ...commande,
        billets: await Promise.all(
          commande.billets.map(async ({ token, ...billet }) => ({
            ...billet,
            qrCode:
              billet.statut === "VALIDE" || billet.statut === "UTILISE"
                ? await genererQRCode(token)
                : undefined,
          })),
        ),
      })),
    );

    return NextResponse.json(resultat);
  } catch (error) {
    console.error("Erreur GET billets/mes:", error);
    return NextResponse.json({ erreur: "Erreur serveur" }, { status: 500 });
  }
}
