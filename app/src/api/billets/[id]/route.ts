import { NextResponse } from "next/server";
import { getUser } from "@/app/lib/getUser";
import { prisma } from "@/app/lib/prisma";
import { genererQRCode } from "@/app/lib/qrcode";

// GET — Détail d'un billet
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getUser(request);
    if (!session) {
      return NextResponse.json({ erreur: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;

    const billet = await prisma.billet.findUnique({
      where: { id },
      include: {
        commande: {
          include: {
            acheteur: { select: { id: true, nom: true, email: true } },
            evenement: {
              select: {
                id: true,
                titre: true,
                lieu: true,
                ville: true,
                dateDebut: true,
                dateFin: true,
              },
            },
          },
        },
        categorie: { select: { libelle: true, prix: true } },
        scans: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!billet) {
      return NextResponse.json(
        { erreur: "Billet introuvable" },
        { status: 404 },
      );
    }

    // Vérifier que le billet appartient à l'utilisateur
    const estProprietaire = billet.commande.acheteurId === session.user.id;
    const estAdmin = session.user.roles.includes("ADMIN");

    if (!estProprietaire && !estAdmin) {
      return NextResponse.json({ erreur: "Accès refusé" }, { status: 403 });
    }

    const qrCode = await genererQRCode(billet.token);

    return NextResponse.json({
      ...billet,
      qrCode,
      dejaScanné: billet.scans.length > 0,
    });
  } catch (error) {
    console.error("Erreur GET billets/[id]:", error);
    return NextResponse.json({ erreur: "Erreur serveur" }, { status: 500 });
  }
}
