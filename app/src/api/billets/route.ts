import { NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { genererQRCode } from "@/app/lib/qrcode";

// GET — Mes billets
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ erreur: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const evenementId = searchParams.get("evenementId");

    const commandes = await prisma.commande.findMany({
      where: {
        acheteurId: session.user.id,
        statut: "PAYEE",
        ...(evenementId && { evenementId }),
      },
      include: {
        evenement: {
          include: { promoteur: { select: { nom: true } } },
        },
        billets: {
          include: { categorie: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Ajouter le QR code à chaque billet
    const commandesAvecQR = await Promise.all(
      commandes.map(async (commande) => ({
        ...commande,
        billets: await Promise.all(
          commande.billets.map(async (billet) => ({
            ...billet,
            qrCode: await genererQRCode(billet.token),
          })),
        ),
      })),
    );

    return NextResponse.json(commandesAvecQR);
  } catch (error) {
    console.error("Erreur GET billets:", error);
    return NextResponse.json({ erreur: "Erreur serveur" }, { status: 500 });
  }
}
