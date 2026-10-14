# Club Culture — correctifs techniques

## Convention monétaire conservée

- `CategorieBillet.prix` reste stocké en **euros entiers** dans la base existante. Aucune conversion de données ni de devise n'est requise.
- Les prix des catégories sont affichés en EUR. Le formulaire enregistre le montant en euros entiers (le schéma utilise `Int`, donc un prix de `35` signifie `35,00 €`).
- À la frontière Stripe, le prix en euros est multiplié par 100. Les montants envoyés à Stripe, `Commande.montantTotal`, `Commande.fraisService` et les montants de versement sont en **centimes EUR**.
- Le code utilise `eur()` pour les montants stockés en euros et `eurCents()` pour les montants stockés en centimes. Ne pas appliquer de conversion aux anciennes valeurs de `CategorieBillet.prix`.

## Correctifs inclus

- Le webhook crée les billets en `EN_ATTENTE_VALIDATION` (jeton provisoire `PENDING-…`) ; le QR code signé (`JWT_SECRET`) n'est émis qu'à la validation admin (`POST /api/admin/billets/[id]/valider`), valable jusqu'à la fin de l'événement + 7 jours.
- L'unicité du `stripePaymentId` et l'association unique entre commande et réservation empêchent l'émission de commandes/billets en double pour un PaymentIntent. La création de PaymentIntent utilise une clé d'idempotence Stripe stable liée à la réservation.
- Les montants sont vérifiés dans le webhook avant d'émettre des billets. Les paiements arrivés après expiration ou incohérents sont remboursés au lieu de générer des billets.
- Une réservation atomique bloque le stock pendant 15 minutes; le job protégé `GET /api/cron/expirer-reservations` traite les réservations expirées.
- La modération exige le statut `EN_MODERATION` pour approuver ou rejeter; le motif de rejet est requis.
- La mise à jour du profil traite les conflits d'adresse e-mail avec une réponse explicite.

## Installation / mise à niveau

1. Sauvegarder la base de données.
2. Installer les dépendances avec `npm install`.
3. Appliquer les changements de schéma sans conversion des prix : `npx prisma db push` puis `npx prisma generate`.
4. Configurer les variables listées dans `.env.example` dans l'environnement serveur.
5. Configurer Stripe pour envoyer `payment_intent.succeeded` et `payment_intent.payment_failed` à `/api/paiement/webhook`.
6. Sur Vercel, vérifier le cron dans `vercel.json`; ailleurs, appeler périodiquement `/api/cron/expirer-reservations` avec `Authorization: Bearer <CRON_SECRET>`.
7. Tester en mode Stripe test : montant en centimes, paiement réussi, webhook reçu deux fois, réservation expirée, paiement tardif et remboursement.

## Précautions

- Ne pas exécuter de script qui multiplie les anciens prix de catégories par 100 ou convertit des FCFA en euros.
- Les commandes conservent leurs montants historiques tels qu'ils ont été réellement enregistrés. Les nouveaux montants de commande sont enregistrés en centimes EUR, comme les montants Stripe.
- Vérifier les anciennes commandes et paiements créés avant ce correctif : les paiements historiques peuvent avoir utilisé une unité incorrecte et doivent être examinés individuellement avant toute correction comptable.
