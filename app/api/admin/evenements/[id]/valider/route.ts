import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { verifierRoleUser } from "@/app/lib/getUser";

// PUT — Admin valide ou rejette un événement
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await verifierRoleUser(request, "ADMIN");

    if (!session) {
      return NextResponse.json(
        { erreur: "Accès refusé — Admin uniquement" },
        { status: 403 },
      );
    }

    const { id } = await params;

    const { decision, raison } = await request.json();

    if (!["PUBLIE", "BROUILLON"].includes(decision)) {
      return NextResponse.json(
        { erreur: "Decision invalide — PUBLIE ou BROUILLON" },
        { status: 400 },
      );
    }

    if (decision === "BROUILLON" && (typeof raison !== "string" || !raison.trim())) {
      return NextResponse.json({ erreur: "Le motif du rejet est obligatoire.", champ: "raison" }, { status: 400 });
    }

    const evenement = await prisma.evenement.findUnique({
      where: { id },
    });

    if (!evenement) {
      return NextResponse.json(
        { erreur: "Événement introuvable" },
        { status: 404 },
      );
    }

    if (evenement.statut !== "EN_MODERATION") {
      return NextResponse.json(
        {
          erreur: "Cet événement n'est pas en attente de modération",
        },
        { status: 400 },
      );
    }

    const updated = await prisma.evenement.update({
      where: { id },
      data: {
        statut: decision,
        motifModeration: decision === "BROUILLON" ? (typeof raison === "string" ? raison.trim() || null : null) : null,
      },
    });

    return NextResponse.json({
      message:
        decision === "PUBLIE"
          ? "Événement publié avec succès"
          : `Événement retourné en brouillon${raison ? ` — ${raison}` : ""}`,
      evenement: updated,
    });
  } catch (error) {
    console.error("Erreur validation admin:", error);

    return NextResponse.json({ erreur: "Erreur serveur" }, { status: 500 });
  }
}

interface Context {
  params: Promise<{
    id: string;
  }>;
}

export async function DELETE(request: Request, { params }: Context) {
  try {
    const admin = await verifierRoleUser(request, "ADMIN");

    if (!admin) {
      return NextResponse.json(
        {
          erreur: "Accès interdit",
        },
        {
          status: 403,
        },
      );
    }

    const { id } = await params;

    const evenement = await prisma.evenement.findUnique({
      where: {
        id,
      },
      include: {
        categories: true,
        commandes: {
          select: {
            id: true,
          },
          take: 1,
        },
      },
    });

    if (!evenement) {
      return NextResponse.json(
        {
          erreur: "Événement introuvable",
        },
        {
          status: 404,
        },
      );
    }

    /*
     * Sécurité :
     * on évite de supprimer un événement
     * qui possède déjà des commandes.
     */
    if (evenement.commandes.length > 0) {
      return NextResponse.json(
        {
          erreur:
            "Cet événement ne peut pas être supprimé car des commandes existent déjà.",
        },
        {
          status: 409,
        },
      );
    }

    await prisma.$transaction(async (tx) => {
      /*
       * Supprimer les catégories avant l'événement
       * si la relation Prisma l'exige.
       */
      await tx.categorieBillet.deleteMany({
        where: {
          evenementId: id,
        },
      });

      await tx.evenement.delete({
        where: {
          id,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Événement supprimé avec succès.",
    });
  } catch (error) {
    console.error("Erreur suppression événement:", error);

    return NextResponse.json(
      {
        erreur: "Impossible de supprimer l'événement.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await verifierRoleUser(request, "ADMIN");

  if (!admin) {
    return NextResponse.json({ erreur: "Accès interdit" }, { status: 403 });
  }

  const { id } = await params;

  const evenement = await prisma.evenement.findUnique({
    where: { id },

    include: {
      promoteur: {
        select: {
          id: true,
          nom: true,
          email: true,
        },
      },

      categories: {
        select: {
          id: true,
          libelle: true,
          prix: true,
          quantite: true,
          vendu: true,
          ouverture: true,
          fermeture: true,
        },
      },
    },
  });

  if (!evenement) {
    return NextResponse.json(
      {
        erreur: "Événement introuvable",
      },
      {
        status: 404,
      },
    );
  }

  return NextResponse.json({
    evenement,
  });
}
