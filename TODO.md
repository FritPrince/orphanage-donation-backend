# TODO — Plateforme de Don aux Orphelinats

Coche chaque tâche au fur et à mesure. L'ordre est important : chaque étape dépend de la précédente.

---

## ÉTAPE 1 — Fondations du projet

- [x] Configurer `main.ts` (Helmet, CORS, rate-limit, prefix global, Swagger)
- [x] Créer `src/config/env.config.ts` (variables d'environnement typées avec Zod)
- [x] Créer le fichier `.env` avec toutes les variables nécessaires
- [x] Créer `src/prisma/prisma.module.ts` et `prisma.service.ts`
- [x] Écrire le schéma Prisma complet (`prisma/schema.prisma`) — 20 tables
- [x] Lancer la première migration (`npx prisma migrate dev --name init`)
- [x] Générer le client Prisma (`npx prisma generate`)

---

## ÉTAPE 2 — Module Auth

- [x] Créer `src/modules/auth/auth.module.ts`
- [x] Créer `src/modules/auth/auth.service.ts` (register, login, refresh)
- [x] Créer `src/modules/auth/auth.controller.ts`
- [x] Créer `src/modules/auth/dto/register.dto.ts`
- [x] Créer `src/modules/auth/dto/login.dto.ts`
- [x] Créer `src/modules/auth/strategies/jwt.strategy.ts`
- [x] Créer `src/modules/auth/strategies/google.strategy.ts`
- [ ] Créer `src/modules/auth/strategies/apple.strategy.ts` (nécessite credentials Apple)
- [x] Créer `src/common/guards/jwt-auth.guard.ts`
- [x] Créer `src/common/guards/roles.guard.ts`
- [x] Créer `src/common/decorators/current-user.decorator.ts`
- [x] Créer `src/common/decorators/roles.decorator.ts`
- [x] Créer `src/common/decorators/public.decorator.ts`
- [x] Tester les endpoints auth avec curl

---

## ÉTAPE 3 — Module Users

- [ ] Créer `src/modules/users/users.module.ts`
- [ ] Créer `src/modules/users/users.service.ts` (profil, mise à jour, suppression)
- [ ] Créer `src/modules/users/users.controller.ts`
- [ ] Créer les DTOs users (update-profile.dto.ts)
- [ ] Endpoint : GET /me (profil connecté)
- [ ] Endpoint : PATCH /me (mise à jour profil)
- [ ] Endpoint : GET /me/donations (historique des dons)

---

## ÉTAPE 4 — Module Orphanages

- [ ] Créer `src/modules/orphanages/orphanages.module.ts`
- [ ] Créer `src/modules/orphanages/orphanages.service.ts`
- [ ] Créer `src/modules/orphanages/orphanages.controller.ts`
- [ ] Endpoint : GET /orphanages (liste avec filtres)
- [ ] Endpoint : GET /orphanages/:id (fiche détaillée)
- [ ] Endpoint : POST /orphanages (création — ORPHANAGE_ADMIN)
- [ ] Endpoint : PATCH /orphanages/:id (mise à jour)
- [ ] Endpoint : GET /orphanages/map (géolocalisation)
- [ ] Endpoint : POST /orphanages/:id/verify (SUPER_ADMIN uniquement)

---

## ÉTAPE 5 — Module Needs (Besoins)

- [ ] Créer `src/modules/needs/needs.module.ts`
- [ ] Créer `src/modules/needs/needs.service.ts`
- [ ] Créer `src/modules/needs/needs.controller.ts`
- [ ] Endpoint : GET /orphanages/:id/needs
- [ ] Endpoint : POST /orphanages/:id/needs (ORPHANAGE_ADMIN)
- [ ] Endpoint : PATCH /needs/:id
- [ ] Endpoint : DELETE /needs/:id

---

## ÉTAPE 6 — Module Payments (Abstraction multi-fournisseurs)

- [ ] Créer `src/modules/payments/payments.module.ts`
- [ ] Créer `src/modules/payments/payments.service.ts` (couche d'abstraction)
- [ ] Créer `src/modules/payments/providers/stripe.provider.ts`
- [ ] Créer `src/modules/payments/providers/paypal.provider.ts`
- [ ] Créer `src/modules/payments/providers/fedapay.provider.ts`
- [ ] Créer `src/modules/payments/providers/mtn.provider.ts`
- [ ] Webhook Stripe (POST /payments/webhook/stripe)
- [ ] Webhook PayPal (POST /payments/webhook/paypal)
- [ ] Webhook FedaPay (POST /payments/webhook/fedapay)

---

## ÉTAPE 7 — Module Donations

- [ ] Créer `src/modules/donations/donations.module.ts`
- [ ] Créer `src/modules/donations/donations.service.ts`
- [ ] Créer `src/modules/donations/donations.controller.ts`
- [ ] Don ponctuel (POST /donations)
- [ ] Don ciblé (avec needId ou campaignId)
- [ ] Don anonyme
- [ ] GET /donations/:id (détail d'un don)
- [ ] Mise à jour statut via webhook paiement

---

## ÉTAPE 8 — Module Subscriptions (Dons récurrents)

- [ ] Créer `src/modules/subscriptions/subscriptions.module.ts`
- [ ] Créer `src/modules/subscriptions/subscriptions.service.ts`
- [ ] Créer `src/modules/subscriptions/subscriptions.controller.ts`
- [ ] POST /subscriptions (créer un abonnement mensuel/annuel)
- [ ] GET /subscriptions/me (mes abonnements actifs)
- [ ] DELETE /subscriptions/:id (annuler)
- [ ] Gérer les renouvellements via Bull Queue

---

## ÉTAPE 9 — Module Campaigns

- [ ] Créer `src/modules/campaigns/campaigns.module.ts`
- [ ] Créer `src/modules/campaigns/campaigns.service.ts`
- [ ] Créer `src/modules/campaigns/campaigns.controller.ts`
- [ ] POST /campaigns (ORPHANAGE_ADMIN)
- [ ] GET /campaigns (liste avec filtre actives/terminées)
- [ ] GET /campaigns/:id
- [ ] Mise à jour automatique du montant collecté après un don
- [ ] Gateway Socket.io pour progression en temps réel

---

## ÉTAPE 10 — Module Sponsorships (Parrainage)

- [ ] Créer `src/modules/sponsorships/sponsorships.module.ts`
- [ ] Créer `src/modules/sponsorships/sponsorships.service.ts`
- [ ] Créer `src/modules/sponsorships/sponsorships.controller.ts`
- [ ] POST /sponsorships (parrainer un enfant)
- [ ] GET /sponsorships/me (mes parrainages)
- [ ] POST /sponsorships/:id/letters (envoyer une lettre)
- [ ] Upload photo enfant (Cloudinary)

---

## ÉTAPE 11 — Module Notifications

- [ ] Créer `src/modules/notifications/notifications.module.ts`
- [ ] Créer `src/modules/notifications/notifications.service.ts`
- [ ] Bull Queue pour envoi asynchrone
- [ ] Notification email (SendGrid/Nodemailer)
- [ ] Notification Push (Firebase FCM)
- [ ] GET /notifications/me
- [ ] PATCH /notifications/:id/read

---

## ÉTAPE 12 — Module Tax Receipts (Reçus fiscaux PDF)

- [ ] Créer `src/modules/tax-receipts/tax-receipts.module.ts`
- [ ] Créer `src/modules/tax-receipts/tax-receipts.service.ts`
- [ ] Template HTML pour le reçu fiscal
- [ ] Génération PDF via Puppeteer
- [ ] Envoi par email après confirmation du don
- [ ] GET /tax-receipts/me (liste)
- [ ] GET /tax-receipts/:id/download (téléchargement PDF)

---

## ÉTAPE 13 — Module Reviews & Testimonials

- [ ] Créer `src/modules/reviews/` (notes donateurs sur orphelinats)
- [ ] Créer `src/modules/testimonials/` (témoignages avec modération)
- [ ] POST /orphanages/:id/reviews
- [ ] GET /orphanages/:id/reviews
- [ ] POST /testimonials
- [ ] PATCH /testimonials/:id/approve (SUPER_ADMIN)

---

## ÉTAPE 14 — Module Events & Engagements

- [ ] Créer `src/modules/events/` (événements par orphelinat)
- [ ] Créer `src/modules/engagements/` (bénévolat, partage)
- [ ] POST /orphanages/:id/events
- [ ] GET /events (liste publique)
- [ ] POST /engagements/volunteer (inscription bénévole)

---

## ÉTAPE 15 — Module Admin (Back-office)

- [ ] Créer `src/modules/admin/admin.module.ts`
- [ ] Créer `src/modules/admin/admin.service.ts`
- [ ] Créer `src/modules/admin/admin.controller.ts`
- [ ] GET /admin/stats (tableau de bord)
- [ ] GET /admin/orphanages (liste + validation)
- [ ] PATCH /admin/orphanages/:id/verify
- [ ] GET /admin/donations (tous les dons)
- [ ] GET /admin/users (gestion utilisateurs)
- [ ] POST /admin/users/:id/ban

---

## ÉTAPE 16 — Transversal & Finalisation

- [ ] Créer `src/common/filters/global-exception.filter.ts`
- [ ] Créer `src/common/interceptors/logging.interceptor.ts`
- [ ] Créer `src/common/interceptors/transform.interceptor.ts`
- [ ] Créer `src/common/pipes/zod-validation.pipe.ts`
- [ ] Tests unitaires des services principaux (Jest)
- [ ] Tests d'intégration (Supertest)
- [ ] Vérifier la documentation Swagger générée
- [ ] Préparer le déploiement Railway (variables d'env, Procfile)

---

## Progression globale

| Étape | Module | Statut |
|-------|--------|--------|
| 1 | Fondations | ✅ Terminé |
| 2 | Auth | ✅ Terminé |
| 3 | Users | ⬜ À faire |
| 4 | Orphanages | ⬜ À faire |
| 5 | Needs | ⬜ À faire |
| 6 | Payments | ⬜ À faire |
| 7 | Donations | ⬜ À faire |
| 8 | Subscriptions | ⬜ À faire |
| 9 | Campaigns | ⬜ À faire |
| 10 | Sponsorships | ⬜ À faire |
| 11 | Notifications | ⬜ À faire |
| 12 | Tax Receipts | ⬜ À faire |
| 13 | Reviews & Testimonials | ⬜ À faire |
| 14 | Events & Engagements | ⬜ À faire |
| 15 | Admin | ⬜ À faire |
| 16 | Finalisation | ⬜ À faire |
