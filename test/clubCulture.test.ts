import Stripe from "stripe";
import { prisma } from "@/app/lib/prisma";

// ─── DONNÉES PARTAGÉES ───────────────────────────────────────
const ctx: {
  adminId: string;
  adminToken: string;
  promoteurId: string;
  promoteurToken: string;
  acheteurId: string;
  acheteurToken: string;
  agentId: string;
  evenementId: string;
  categorieId: string;
  reservationId: string;
  paymentIntentId: string;
  commandeId: string;
  billetToken: string;
  billetId: string;
} = {} as any;

const BASE = "http://localhost:3000";

// ─── HELPER API ──────────────────────────────────────────────
async function api(
  method: string,
  path: string,
  body?: object,
  token?: string,
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Vérifier que la réponse est bien du JSON
  const contentType = res.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    console.error(`❌ Réponse non-JSON sur ${method} ${path}: ${res.status}`);
    return { status: res.status, data: {} };
  }

  const data = await res.json();
  return { status: res.status, data };
}

// ─── NETTOYAGE AVANT TOUS LES TESTS ─────────────────────────
beforeAll(async () => {
  // Garde-fou : ce nettoyage efface TOUTES les tables (utilisateurs compris).
  if (process.env.TEST_DB_RESET !== "1") {
    throw new Error(
      "Tests d'intégration : ils vident la base DATABASE_URL. Pointez-la vers une base de test " +
        "dédiée puis lancez avec TEST_DB_RESET=1.",
    );
  }
  console.log("🧹 Nettoyage de la base de données de test...");

  // Supprimer dans l'ordre (respecter les relations FK)
  await prisma.passwordResetToken.deleteMany({});
  await prisma.versement.deleteMany({});
  await prisma.scan.deleteMany({});
  await prisma.billet.deleteMany({});
  await prisma.commande.deleteMany({});
  await prisma.reservation.deleteMany({});
  await prisma.categorieBillet.deleteMany({});
  await prisma.beneficiaire.deleteMany({});
  await prisma.evenement.deleteMany({});
  await prisma.userRole.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("✅ Base nettoyée — prête pour les tests");
}, 30000);

// ─── FERMER PRISMA APRÈS TOUS LES TESTS ─────────────────────
afterAll(async () => {
  await prisma.$disconnect();
});

// ─────────────────────────────────────────────────────────────
// BLOC 1 — CRÉATION DE L'ADMIN
// ─────────────────────────────────────────────────────────────

describe("1. Création de l'Admin", () => {
  it("1.1 crée l'administrateur avec la clé secrète", async () => {
    const res = await fetch(`${BASE}/api/admin/setup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": process.env.ADMIN_SECRET!,
      },
      body: JSON.stringify({
        email: "admin@clubculture.com",
        nom: "Administrateur",
        password: "AdminSecret123!",
      }),
    });

    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.admin.roles).toContain("ADMIN");

    ctx.adminId = data.admin.id;
  });

  it("1.2 refuse si la clé secrète est mauvaise", async () => {
    const res = await fetch(`${BASE}/api/admin/setup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": "mauvaise_cle",
      },
      body: JSON.stringify({
        email: "faux@admin.com",
        nom: "Faux Admin",
        password: "password123",
      }),
    });

    expect(res.status).toBe(403);
  });

  it("1.3 refuse si un admin existe déjà", async () => {
    const res = await fetch(`${BASE}/api/admin/setup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": process.env.ADMIN_SECRET!,
      },
      body: JSON.stringify({
        email: "admin2@clubculture.com",
        nom: "Admin 2",
        password: "AdminSecret123!",
      }),
    });

    expect(res.status).toBe(409);
  });

  it("1.4 l'admin peut se connecter", async () => {
    const { status, data } = await api("POST", "/api/auth/connexion", {
      email: "admin@clubculture.com",
      password: "AdminSecret123!",
    });

    expect(status).toBe(200);
    expect(data.token).toBeDefined();
    ctx.adminToken = data.token;
  });
});

// ─────────────────────────────────────────────────────────────
// BLOC 2 — INSCRIPTION DES UTILISATEURS
// ─────────────────────────────────────────────────────────────

describe("2. Inscription des utilisateurs", () => {
  it("2.1 un acheteur peut s'inscrire", async () => {
    const { status, data } = await api("POST", "/api/auth/inscription", {
      email: "acheteur@test.com",
      nom: "Jean Acheteur",
      password: "Motdepasse123!",
      role: "ACHETEUR",
    });

    expect(status).toBe(201);
    expect(data.user.roles).toContain("ACHETEUR");
    expect(data.redirection).toBe("/evenements");

    ctx.acheteurId = data.user.id;
  });

  it("2.2 un promoteur peut s'inscrire", async () => {
    const { status, data } = await api("POST", "/api/auth/inscription", {
      email: "promoteur@test.com",
      nom: "Marie Promoteur",
      password: "Motdepasse123!",
      role: "PROMOTEUR",
    });

    expect(status).toBe(201);
    expect(data.user.roles).toContain("PROMOTEUR");
    expect(data.redirection).toBe("/promoteur/dashboard");

    ctx.promoteurId = data.user.id;
  });

  it("2.3 un prestataire peut s'inscrire", async () => {
    const { status, data } = await api("POST", "/api/auth/inscription", {
      email: "dj@test.com",
      nom: "DJ Kamto",
      password: "Motdepasse123!",
      role: "PRESTATAIRE",
    });

    expect(status).toBe(201);
    expect(data.user.roles).toContain("PRESTATAIRE");
    expect(data.redirection).toBe("/prestataire/dashboard");
  });

  it("2.4 refuse si l'email est déjà utilisé", async () => {
    const { status, data } = await api("POST", "/api/auth/inscription", {
      email: "acheteur@test.com",
      nom: "Doublon",
      password: "Motdepasse123!",
      role: "ACHETEUR",
    });

    expect(status).toBe(409);
    expect(data.erreur).toContain("déjà utilisé");
  });

  it("2.5 refuse si le rôle est ADMIN ou AGENT", async () => {
    const { status } = await api("POST", "/api/auth/inscription", {
      email: "faux@admin.com",
      nom: "Faux Admin",
      password: "Motdepasse123!",
      role: "ADMIN",
    });

    expect(status).toBe(400);
  });

  it("2.6 refuse si le mot de passe est trop court", async () => {
    const { status, data } = await api("POST", "/api/auth/inscription", {
      email: "new@test.com",
      nom: "Test",
      password: "123",
      role: "ACHETEUR",
    });

    expect(status).toBe(400);
    expect(data.erreur).toContain("8 caractères");
  });

  it("2.7 le promoteur peut se connecter", async () => {
    const { status, data } = await api("POST", "/api/auth/connexion", {
      email: "promoteur@test.com",
      password: "Motdepasse123!",
    });

    expect(status).toBe(200);
    expect(data.token).toBeDefined();
    ctx.promoteurToken = data.token;
  });

  it("2.8 l'acheteur peut se connecter", async () => {
    const { status, data } = await api("POST", "/api/auth/connexion", {
      email: "acheteur@test.com",
      password: "Motdepasse123!",
    });

    expect(status).toBe(200);
    ctx.acheteurToken = data.token;
  });
});

// // ─────────────────────────────────────────────────────────────
// // BLOC 3 — GESTION DES RÔLES PAR L'ADMIN
// // ─────────────────────────────────────────────────────────────

describe("3. Gestion des rôles par l'Admin", () => {
  it("3.1 l'admin peut voir tous les utilisateurs", async () => {
    const { status, data } = await api(
      "GET",
      "/api/admin/users",
      undefined,
      ctx.adminToken,
    );

    expect(status).toBe(200);
    expect(data.length).toBeGreaterThanOrEqual(3); // admin + acheteur + promoteur
  });

  it("3.2 l'admin peut créer un agent directement", async () => {
    const { status, data } = await api(
      "POST",
      "/api/admin/users",
      {
        email: "agent@test.com",
        nom: "Agent Sécurité",
        password: "Motdepasse123!",
        roles: ["AGENT"],
      },
      ctx.adminToken,
    );

    expect(status).toBe(201);
    expect(data.user.roles).toContain("AGENT");
    ctx.agentId = data.user.id;
  });

  it("3.3 l'admin peut ajouter un rôle à un utilisateur existant", async () => {
    const { status, data } = await api(
      "POST",
      `/api/admin/users/${ctx.acheteurId}/roles`,
      { role: "PROMOTEUR" },
      ctx.adminToken,
    );

    expect(status).toBe(200);
    expect(data.user.roles).toContain("ACHETEUR");
    expect(data.user.roles).toContain("PROMOTEUR");
  });

  it("3.4 l'admin peut retirer un rôle", async () => {
    const { status, data } = await api(
      "DELETE",
      `/api/admin/users/${ctx.acheteurId}/roles`,
      { role: "PROMOTEUR" },
      ctx.adminToken,
    );

    expect(status).toBe(200);
    expect(data.user.roles).not.toContain("PROMOTEUR");
  });

  it("3.5 refuse de retirer le dernier rôle", async () => {
    const { status, data } = await api(
      "DELETE",
      `/api/admin/users/${ctx.acheteurId}/roles`,
      { role: "ACHETEUR" },
      ctx.adminToken,
    );

    expect(status).toBe(400);
    expect(data.erreur).toContain("dernier rôle");
  });

  it("3.6 un non-admin ne peut pas accéder aux routes admin", async () => {
    const { status } = await api(
      "GET",
      "/api/admin/users",
      undefined,
      ctx.acheteurToken,
    );

    expect(status).toBe(403);
  });
});

// // ─────────────────────────────────────────────────────────────
// // BLOC 4 — CRÉATION ET GESTION DES ÉVÉNEMENTS
// // ─────────────────────────────────────────────────────────────

describe("4. Création et gestion des événements", () => {
  it("4.1 un acheteur ne peut pas créer un événement", async () => {
    const { status } = await api(
      "POST",
      "/api/evenements",
      {
        titre: "Test",
        description: "Test",
        lieu: "Test",
        ville: "Paris",
        dateDebut: "2027-06-01T20:00:00Z",
        dateFin: "2027-06-01T23:00:00Z",
      },
      ctx.acheteurToken,
    );

    expect(status).toBe(403);
  });

  it("4.2 le promoteur peut créer un événement", async () => {
    const { status, data } = await api(
      "POST",
      "/api/evenements",
      {
        titre: "Soirée Afrobeats Paris",
        description: "La plus grande soirée afrobeats de l'année",
        lieu: "Le Bataclan",
        ville: "Paris",
        adresse: "50 Boulevard Voltaire, 75011 Paris",
        dateDebut: "2027-06-01T20:00:00Z",
        dateFin: "2027-06-02T02:00:00Z",
        styles: ["Afrobeats", "Amapiano"],
        categories: [
          {
            libelle: "VIP",
            prix: 80,
            quantite: 50,
          },
          {
            libelle: "Standard",
            prix: 35,
            quantite: 200,
          },
        ],
      },
      ctx.promoteurToken,
    );

    expect(status).toBe(201);
    expect(data.evenement.statut).toBe("BROUILLON");
    expect(data.evenement.categories).toHaveLength(2);

    ctx.evenementId = data.evenement.id;
    ctx.categorieId = data.evenement.categories.find(
      (c: any) => c.libelle === "Standard",
    ).id;
  });

  it("4.3 refuse si les champs obligatoires manquent", async () => {
    const { status, data } = await api(
      "POST",
      "/api/evenements",
      { titre: "Incomplet" },
      ctx.promoteurToken,
    );

    expect(status).toBe(400);
    expect(data.erreur).toContain("obligatoires");
  });

  it("4.4 refuse si la date de fin est avant la date de début", async () => {
    const { status, data } = await api(
      "POST",
      "/api/evenements",
      {
        titre: "Test",
        description: "Test",
        lieu: "Test",
        ville: "Paris",
        dateDebut: "2027-06-01T23:00:00Z",
        dateFin: "2027-06-01T20:00:00Z",
      },
      ctx.promoteurToken,
    );

    expect(status).toBe(400);
    expect(data.erreur).toContain("date de fin");
  });

  it("4.5 l'événement est visible par le promoteur en brouillon", async () => {
    const { status, data } = await api(
      "GET",
      `/api/evenements/${ctx.evenementId}`,
      undefined,
      ctx.promoteurToken,
    );

    expect(status).toBe(200);
    expect(data.statut).toBe("BROUILLON");
  });

  it("4.6 l'événement brouillon n'est pas visible publiquement", async () => {
    const { status } = await api("GET", `/api/evenements/${ctx.evenementId}`);

    expect(status).toBe(404);
  });

  it("4.7 le promoteur peut modifier son événement", async () => {
    const { status, data } = await api(
      "PUT",
      `/api/evenements/${ctx.evenementId}`,
      { titre: "Soirée Afrobeats Paris — Édition Spéciale" },
      ctx.promoteurToken,
    );

    expect(status).toBe(200);
    expect(data.evenement.titre).toContain("Édition Spéciale");
  });

  it("4.8 le promoteur soumet son événement à la modération", async () => {
    const { status, data } = await api(
      "POST",
      `/api/evenements/${ctx.evenementId}/publier`,
      undefined,
      ctx.promoteurToken,
    );

    expect(status).toBe(200);
    expect(data.evenement.statut).toBe("EN_MODERATION");
  });

  it("4.9 l'admin valide et publie l'événement", async () => {
    const { status, data } = await api(
      "PUT",
      `/api/admin/evenements/${ctx.evenementId}/valider`,
      { decision: "PUBLIE" },
      ctx.adminToken,
    );

    expect(status).toBe(200);
    expect(data.evenement.statut).toBe("PUBLIE");
  });

  it("4.10 l'événement publié est visible publiquement", async () => {
    const { status, data } = await api(
      "GET",
      `/api/evenements/${ctx.evenementId}`,
    );

    expect(status).toBe(200);
    expect(data.statut).toBe("PUBLIE");
    expect(data.titre).toContain("Afrobeats");
  });

  it("4.11 la liste publique contient l'événement", async () => {
    const { status, data } = await api("GET", "/api/evenements?ville=Paris");

    expect(status).toBe(200);
    expect(data.evenements.some((e: any) => e.id === ctx.evenementId)).toBe(
      true,
    );
  });

  it("4.12 le promoteur voit ses statistiques", async () => {
    const { status, data } = await api(
      "GET",
      "/api/promoteur/evenements",
      undefined,
      ctx.promoteurToken,
    );

    expect(status).toBe(200);
    expect(data.some((e: any) => e.id === ctx.evenementId)).toBe(true);
    expect(data[0].stats).toBeDefined();
    expect(data[0].stats.placesTotal).toBe(250); // 50 VIP + 200 Standard
  });
});

// // ─────────────────────────────────────────────────────────────
// // BLOC 5 — PAIEMENT
// // ─────────────────────────────────────────────────────────────

describe("5. Paiement", () => {
  it("5.1 un non-authentifié ne peut pas initier un paiement", async () => {
    const { status } = await api("POST", "/api/paiement/creer", {
      categorieId: ctx.categorieId,
      quantite: 2,
      nomPorteur: "Jean Acheteur",
    });

    expect(status).toBe(401);
  });

  it("5.2 retourne 404 si catégorie inexistante", async () => {
    const { status, data } = await api(
      "POST",
      "/api/paiement/creer",
      {
        categorieId: "cat_inexistant",
        quantite: 1,
        nomPorteur: "Jean Acheteur",
      },
      ctx.acheteurToken,
    );

    expect(status).toBe(404);
    expect(data.erreur).toContain("introuvable");
  });

  it("5.3 retourne 400 si plus assez de places", async () => {
    const { status, data } = await api(
      "POST",
      "/api/paiement/creer",
      {
        categorieId: ctx.categorieId,
        quantite: 999,
        nomPorteur: "Jean Acheteur",
      },
      ctx.acheteurToken,
    );

    expect(status).toBe(400);
    expect(data.erreur).toContain("places");
  });

  it("5.4 l'acheteur initie un paiement et reçoit un clientSecret", async () => {
    const { status, data } = await api(
      "POST",
      "/api/paiement/creer",
      {
        categorieId: ctx.categorieId,
        quantite: 2,
        nomPorteur: "Jean Acheteur",
      },
      ctx.acheteurToken,
    );

    expect(status).toBe(200);
    expect(data.clientSecret).toBeDefined();
    expect(data.montantBillets).toBe(7000); // 3500 x 2
    expect(data.fraisService).toBe(350); // 5% de 7000
    expect(data.montantTotal).toBe(7350); // 7000 centimes + 350 centimes de frais
    expect(data.reservationId).toBeDefined();
    expect(data.expireAt).toBeDefined();
    ctx.reservationId = data.reservationId;
    const reservation = await prisma.reservation.findUnique({ where: { id: data.reservationId } });
    ctx.paymentIntentId = reservation!.paymentIntentId!;
  });

  it("5.5 le webhook Stripe crée la commande et les billets", async () => {
    // Simuler le webhook Stripe payment_intent.succeeded
    const payload = JSON.stringify({
      id: `evt_test_${Date.now()}`,
      object: "event",
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: ctx.paymentIntentId,
          amount: 7350,
          currency: "eur",
          status: "succeeded",
          metadata: {
            reservationId: ctx.reservationId,
            categorieId: ctx.categorieId,
            quantite: "2",
            nomPorteur: "Jean Acheteur",
            acheteurId: ctx.acheteurId,
            evenementId: ctx.evenementId,
          },
        },
      },
    });

    // Signature valide calculée avec STRIPE_WEBHOOK_SECRET (le webhook la vérifie)
    const signature = new Stripe(
      process.env.STRIPE_SECRET_KEY ?? "sk_test_x",
    ).webhooks.generateTestHeaderString({
      payload,
      secret: process.env.STRIPE_WEBHOOK_SECRET!,
    });

    const res = await fetch(`${BASE}/api/paiement/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": signature,
      },
      body: payload,
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.recu).toBe(true);
  });

  it("5.6 les billets ont été créés après le webhook", async () => {
    const { status, data } = await api(
      "GET",
      "/api/users",
      undefined,
      ctx.acheteurToken,
    );

    expect(status).toBe(200);
    expect(data.commandes.length).toBeGreaterThan(0);

    const commande = data.commandes[0];
    expect(commande.billets.length).toBe(2);
    expect(commande.statut).toBe("EN_ATTENTE_VALIDATION");

    ctx.commandeId = commande.id;
    ctx.billetId = commande.billets[0].id;
  });

  it("5.7 l'admin valide les billets, qui reçoivent leur QR signé", async () => {
    const billets = await prisma.billet.findMany({
      where: { commandeId: ctx.commandeId },
    });

    for (const billet of billets) {
      const { status } = await api(
        "POST",
        `/api/admin/billets/${billet.id}/valider`,
        undefined,
        ctx.adminToken,
      );
      expect(status).toBe(200);
    }

    const commande = await prisma.commande.findUnique({
      where: { id: ctx.commandeId },
    });
    expect(commande!.statut).toBe("PAYEE");

    const billet = await prisma.billet.findUnique({
      where: { id: ctx.billetId },
    });
    expect(billet!.statut).toBe("VALIDE");
    ctx.billetToken = billet!.token;
  });

  it("5.8 l'acheteur voit ses billets avec QR code", async () => {
    const { status, data } = await api(
      "GET",
      "/api/billets/mes",
      undefined,
      ctx.acheteurToken,
    );

    expect(status).toBe(200);
    expect(data[0].billets[0].qrCode).toMatch(/^data:image\/png/);
    expect(data[0].billets[0].token).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────
// BLOC 6 — SCAN DES BILLETS
// ─────────────────────────────────────────────────────────────

describe("6. Scan des billets", () => {
  let agentToken: string;

  beforeAll(async () => {
    const { data } = await api("POST", "/api/auth/connexion", {
      email: "agent@test.com",
      password: "Motdepasse123!",
    });
    agentToken = data.token;
  });

  it("6.1 un non-authentifié ne peut pas scanner", async () => {
    const { status } = await api("POST", "/api/scan", {
      token: ctx.billetToken,
      evenementId: ctx.evenementId,
    });

    expect(status).toBe(401);
  });

  it("6.2 un token invalide retourne INVALIDE", async () => {
    const { status, data } = await api(
      "POST",
      "/api/scan",
      { token: "token_invalide", evenementId: ctx.evenementId },
      agentToken,
    );

    expect(status).toBe(200);
    expect(data.resultat).toBe("INVALIDE");
    expect(data.couleur).toBe("ROUGE");
  });

  it("6.3 un billet valide retourne VALIDE", async () => {
    const { status, data } = await api(
      "POST",
      "/api/scan",
      {
        token: ctx.billetToken,
        evenementId: ctx.evenementId,
        horsLigne: false,
      },
      agentToken,
    );

    expect(status).toBe(200);
    expect(data.resultat).toBe("VALIDE");
    expect(data.couleur).toBe("VERT");
    expect(data.billet.porteur).toBe("Jean Acheteur");
  });

  it("6.4 scanner le même billet retourne DEJA_UTILISE", async () => {
    const { data } = await api(
      "POST",
      "/api/scan",
      {
        token: ctx.billetToken,
        evenementId: ctx.evenementId,
      },
      agentToken,
    );

    expect(data.resultat).toBe("DEJA_UTILISE");
    expect(data.couleur).toBe("ORANGE");
    expect(data.premierScan).toBeDefined();
  });

  it("6.5 un billet d'un autre événement retourne MAUVAIS_EVENEMENT", async () => {
    const { data } = await api(
      "POST",
      "/api/scan",
      {
        token: ctx.billetToken,
        evenementId: "evt_autre_123",
      },
      agentToken,
    );

    expect(data.resultat).toBe("MAUVAIS_EVENEMENT");
    expect(data.couleur).toBe("ROUGE");
  });

  it("6.6 l'agent peut voir les stats de scan", async () => {
    const { status, data } = await api(
      "GET",
      `/api/scan?evenementId=${ctx.evenementId}`,
      undefined,
      agentToken,
    );

    expect(status).toBe(200);
    expect(data.entres).toBe(1); // 1 billet scanné
    expect(data.total).toBe(2); // 2 billets au total
    expect(data.tauxEntree).toBe(50); // 50%
  });
});

// ─────────────────────────────────────────────────────────────
// BLOC 7 — RÉPARTITION DES RECETTES (Sprint 6)
// ─────────────────────────────────────────────────────────────

describe("7. Répartition des recettes (Sprint 6)", () => {
  let prestataire2Id: string;
  let prestataire2Token: string;

  beforeAll(async () => {
    // Créer un prestataire avec compte Stripe simulé
    const { data: inscData } = await api("POST", "/api/auth/inscription", {
      email: "dj.kamto@test.com",
      nom: "DJ Kamto",
      password: "Motdepasse123!",
      role: "PRESTATAIRE",
    });
    prestataire2Id = inscData.user.id;

    const { data: loginData } = await api("POST", "/api/auth/connexion", {
      email: "dj.kamto@test.com",
      password: "Motdepasse123!",
    });
    prestataire2Token = loginData.token;
  });

  it("7.1 le promoteur peut ajouter un bénéficiaire", async () => {
    if (!ctx.evenementId || !prestataire2Id) return;

    const { status, data } = await api(
      "POST",
      `/api/evenements/${ctx.evenementId}/beneficiaires`,
      {
        userId: prestataire2Id,
        role: "DJ",
        typePart: "POURCENTAGE",
        valeur: 20, // 20% des recettes
      },
      ctx.promoteurToken,
    );

    expect(status).toBe(201);
    expect(data.beneficiaire.role).toBe("DJ");
    expect(data.beneficiaire.valeur).toBe(20);
  });

  it("7.2 le promoteur voit la liste des bénéficiaires", async () => {
    if (!ctx.evenementId) return;

    const { status, data } = await api(
      "GET",
      `/api/evenements/${ctx.evenementId}/beneficiaires`,
      undefined,
      ctx.promoteurToken,
    );

    expect(status).toBe(200);
    expect(data.beneficiaires.length).toBeGreaterThan(0);
  });

  it("7.3 refuse la répartition si événement pas terminé", async () => {
    if (!ctx.evenementId) return;

    const { status, data } = await api(
      "POST",
      `/api/evenements/${ctx.evenementId}/repartir`,
      undefined,
      ctx.promoteurToken,
    );

    expect(status).toBe(400);
    expect(data.erreur).toContain("après la fin");
  });

  it("7.4 refuse si typePart invalide", async () => {
    if (!ctx.evenementId || !prestataire2Id) return;

    const { status, data } = await api(
      "POST",
      `/api/evenements/${ctx.evenementId}/beneficiaires`,
      {
        userId: prestataire2Id,
        role: "Technicien",
        typePart: "INVALIDE",
        valeur: 500,
      },
      ctx.promoteurToken,
    );

    expect(status).toBe(400);
    expect(data.erreur).toContain("FIXE ou POURCENTAGE");
  });

  it("7.5 refuse si pourcentage invalide (> 100)", async () => {
    if (!ctx.evenementId || !prestataire2Id) return;

    const { status, data } = await api(
      "POST",
      `/api/evenements/${ctx.evenementId}/beneficiaires`,
      {
        userId: prestataire2Id,
        role: "Test",
        typePart: "POURCENTAGE",
        valeur: 150,
      },
      ctx.promoteurToken,
    );

    expect(status).toBe(400);
    expect(data.erreur).toContain("100");
  });

  it("7.6 un non-promoteur ne peut pas gérer les bénéficiaires", async () => {
    if (!ctx.evenementId) return;

    const { status } = await api(
      "POST",
      `/api/evenements/${ctx.evenementId}/beneficiaires`,
      {
        userId: prestataire2Id,
        role: "DJ",
        typePart: "FIXE",
        valeur: 5000,
      },
      ctx.acheteurToken,
    );

    expect(status).toBe(403);
  });
});
