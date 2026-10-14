# Club Culture — billetterie d'événements

Next.js 16 (App Router) · Prisma 7 / PostgreSQL · Stripe (paiement + Connect) · Resend · Tailwind 4.

## Rôles et parcours

| Rôle | Pages | Ce qu'il fait |
|---|---|---|
| Public | `/`, `/evenements`, `/evenements/[id]` | Consulte les événements publiés |
| ACHETEUR | `/checkout`, `/mes-billets`, `/profil` | Réserve (stock bloqué 15 min), paie par Stripe, récupère ses QR |
| PROMOTEUR | `/promoteur/*` | Crée un événement, le soumet à la modération, gère bénéficiaires et répartition |
| ADMIN | `/admin/*` | Modère les événements, valide/refuse les billets, rembourse, gère les rôles |
| AGENT | `/agent/scan` | Scanne les QR à l'entrée |
| PRESTATAIRE | `/prestataire` | Bénéficiaire d'une répartition (compte Stripe Connect) |

Cycle d'un billet : paiement → webhook Stripe → billet `EN_ATTENTE_VALIDATION` →
validation admin (QR signé, `VALIDE`) → scan (`UTILISE`). Un refus admin rembourse la commande.

Unités : `CategorieBillet.prix` en **euros entiers** ; montants Stripe, `Commande` et
parts FIXE des bénéficiaires en **centimes** (voir `MODIFICATIONS-TECHNIQUES.md`).

## Scan à l'entrée (`/agent/scan`)

1. L'agent choisit l'événement : l'appareil télécharge la liste de ses billets
   (`GET /api/scan/manifest`) — empreintes SHA-256 des QR, jamais les QR eux-mêmes.
2. **En ligne**, chaque QR est vérifié par le serveur (`POST /api/scan`, passage
   `VALIDE → UTILISE` atomique : un billet n'entre qu'une fois, même avec plusieurs portes).
3. **Hors ligne**, le QR est vérifié sur l'appareil contre la liste : vert / orange (déjà
   passé sur cet appareil) / rouge (inconnu, remboursé, autre événement). Le passage est
   gardé en file (IndexedDB) avec son heure réelle.
4. Au retour du réseau (et chaque minute), la file est envoyée ; les billets acceptés hors
   ligne mais déjà passés ailleurs apparaissent dans « Conflits ». La liste est rafraîchie.

Limite : hors ligne, deux portes sans réseau ne se voient pas — un même billet peut passer
une fois par appareil ; le conflit est signalé à la synchronisation. La caméra exige HTTPS
(ou `localhost`) ; sinon, utiliser la saisie manuelle.

## Démarrage

```bash
cp .env.example .env      # puis renseigner les valeurs
npm install
npx prisma db push        # crée/met à jour le schéma
npx prisma generate
npm run dev               # http://localhost:3000
```

Premier administrateur : ouvrir `/setup-admin` et saisir `ADMIN_SECRET`.

Webhook Stripe en local :

```bash
stripe listen --forward-to localhost:3000/api/paiement/webhook
```

## Tests d'intégration

`test/clubCulture.test.ts` appelle l'API réelle (`npm run dev` doit tourner) et
**vide toutes les tables** de `DATABASE_URL` avant de commencer. À lancer uniquement
contre une base de test dédiée :

```bash
TEST_DB_RESET=1 npm test
```

## Déploiement (Vercel)

`vercel.json` planifie `/api/cron/expirer-reservations` une fois par jour (limite du plan
Hobby). Les réservations expirées sont aussi libérées à chaque nouveau paiement ; sur un
plan payant, réduire l'intervalle (ex. `*/5 * * * *`).
