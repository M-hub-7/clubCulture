-- Club Culture: prix en centimes EUR, réservation temporaire, traçabilité de modération.
ALTER TABLE "CategorieBillet" ADD COLUMN "reserve" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Evenement" ADD COLUMN "motifModeration" TEXT;
ALTER TABLE "Commande" ADD COLUMN "reservationId" TEXT;

-- Nettoyage idempotent des doublons historiques éventuels avant d'ajouter l'unicité.
-- On conserve la commande la plus ancienne et on déplace ses billets doublons vers elle
-- en les marquant ANNULE afin de conserver une trace sans laisser circuler de billets en trop.
WITH commandes_classees AS (
  SELECT "id", "stripePaymentId",
         FIRST_VALUE("id") OVER (PARTITION BY "stripePaymentId" ORDER BY "createdAt", "id") AS commande_conservee,
         ROW_NUMBER() OVER (PARTITION BY "stripePaymentId" ORDER BY "createdAt", "id") AS rang
  FROM "Commande"
  WHERE "stripePaymentId" IS NOT NULL
), doublons AS (
  SELECT "id", commande_conservee FROM commandes_classees WHERE rang > 1
)
UPDATE "Billet" b
SET "commandeId" = d.commande_conservee, "statut" = 'ANNULE'
FROM doublons d
WHERE b."commandeId" = d."id";

WITH commandes_classees AS (
  SELECT "id",
         ROW_NUMBER() OVER (PARTITION BY "stripePaymentId" ORDER BY "createdAt", "id") AS rang
  FROM "Commande"
  WHERE "stripePaymentId" IS NOT NULL
)
DELETE FROM "Commande" c USING commandes_classees cc
WHERE c."id" = cc."id" AND cc.rang > 1;

-- Une même intention de paiement Stripe ne peut produire qu'une commande.
CREATE UNIQUE INDEX "Commande_stripePaymentId_key" ON "Commande"("stripePaymentId");
CREATE UNIQUE INDEX "Commande_reservationId_key" ON "Commande"("reservationId");

CREATE TABLE "Reservation" (
  "id" TEXT NOT NULL,
  "acheteurId" TEXT NOT NULL,
  "categorieId" TEXT NOT NULL,
  "evenementId" TEXT NOT NULL,
  "quantite" INTEGER NOT NULL,
  "nomPorteur" TEXT NOT NULL,
  "statut" TEXT NOT NULL DEFAULT 'ACTIVE',
  "expireAt" TIMESTAMP(3) NOT NULL,
  "paymentIntentId" TEXT,
  "requestKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Reservation_paymentIntentId_key" ON "Reservation"("paymentIntentId");
CREATE UNIQUE INDEX "Reservation_requestKey_key" ON "Reservation"("requestKey");
CREATE INDEX "Reservation_statut_expireAt_idx" ON "Reservation"("statut", "expireAt");
CREATE INDEX "Reservation_acheteurId_createdAt_idx" ON "Reservation"("acheteurId", "createdAt");

ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_acheteurId_fkey"
  FOREIGN KEY ("acheteurId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_categorieId_fkey"
  FOREIGN KEY ("categorieId") REFERENCES "CategorieBillet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_evenementId_fkey"
  FOREIGN KEY ("evenementId") REFERENCES "Evenement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Commande" ADD CONSTRAINT "Commande_reservationId_fkey"
  FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Conversion des montants historiques saisis en XAF entiers.
-- Taux fixe XAF/EUR: 655,957 XAF pour 1 EUR. Vérifier les données avant exécution en production.
-- CategorieBillet.prix est en EUROS entiers (le code multiplie par 100 pour Stripe) ;
-- Beneficiaire.valeur FIXE est en CENTIMES.
UPDATE "CategorieBillet" SET "prix" = ROUND("prix" / 655.957)::INTEGER;
UPDATE "Beneficiaire" SET "valeur" = ROUND("valeur" * 100.0 / 655.957)::INTEGER WHERE "typePart" = 'FIXE';
