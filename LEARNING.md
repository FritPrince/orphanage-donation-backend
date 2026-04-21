# Guide d'apprentissage — Backend Plateforme de Don aux Orphelinats

Ce fichier t'explique **ce qu'on fait, pourquoi on le fait, et comment ça marche**.
Il évolue au fur et à mesure du projet.

---

## CHAPITRE 1 — Architecture NestJS : pourquoi cette structure ?

### Le problème que NestJS résout

Quand tu écris un backend Node.js avec Express seul, tu te retrouves vite avec des fichiers
qui font tout : recevoir les requêtes, valider les données, accéder à la base, envoyer les réponses.
Ça devient ingérable dès que le projet grossit.

NestJS impose une **architecture modulaire** inspirée d'Angular. Chaque fonctionnalité est
encapsulée dans un **module** qui contient exactement 3 types de fichiers :

```
mon-module/
├── mon-module.module.ts     → déclare ce que le module expose et ce dont il a besoin
├── mon-module.controller.ts → reçoit les requêtes HTTP (routes)
└── mon-module.service.ts    → contient la logique métier
```

### Le flux d'une requête HTTP dans NestJS

```
Requête HTTP
     ↓
[Guards]          → "Est-ce que cet utilisateur a le droit ?"
     ↓
[Interceptors]    → "Transforme la requête avant qu'elle arrive"
     ↓
[Pipes]           → "Valide et transforme les données reçues"
     ↓
[Controller]      → "Quelle route ? Quel handler appeler ?"
     ↓
[Service]         → "Logique métier, accès à la base de données"
     ↓
[Interceptors]    → "Transforme la réponse avant de l'envoyer"
     ↓
Réponse HTTP
```

### Pourquoi des décorateurs (@) partout ?

TypeScript supporte les **décorateurs** — des fonctions qui annotent des classes ou méthodes.
NestJS les utilise massivement pour déclarer le comportement sans mélanger la logique :

```typescript
@Controller('users')         // → ce contrôleur gère /users
export class UsersController {

  @Get(':id')                // → GET /users/:id
  @UseGuards(JwtAuthGuard)   // → protégé par JWT
  findOne(@Param('id') id: string) {
    // ...
  }
}
```

C'est plus lisible qu'une longue chaîne de middlewares Express.

---

## CHAPITRE 2 — Base de données : PostgreSQL + Prisma

### Pourquoi PostgreSQL et pas MongoDB ?

Ce projet gère de **l'argent réel**. PostgreSQL est une base **ACID** :
- **A**tomicité : une transaction est tout ou rien (pas de demi-don enregistré)
- **C**ohérence : les contraintes sont toujours respectées (pas de don sans donateur)
- **I**solement : deux transactions simultanées ne s'interfèrent pas
- **D**urabilité : une fois confirmé, c'est permanent même si le serveur plante

MongoDB est flexible mais ne garantit pas ces propriétés par défaut. Pour des paiements, c'est rédhibitoire.

### Pourquoi Prisma et pas TypeORM ou Sequelize ?

Prisma a une approche **schema-first** : tu décris tes tables dans `schema.prisma`,
et Prisma génère automatiquement un client TypeScript **100% typé**.

```prisma
model User {
  id    String @id @default(cuid())
  email String @unique
  name  String
}
```

Ensuite dans ton code :
```typescript
// TypeScript sait exactement ce que retourne cette fonction
const user = await prisma.user.findUnique({ where: { email } })
// user.email ✅  user.emaill ❌ (erreur à la compilation)
```

Avec TypeORM, les types sont souvent approximatifs et les erreurs n'apparaissent qu'à l'exécution.

### Les relations dans Prisma

```prisma
model User {
  donations Donation[]   // Un user peut avoir plusieurs dons
}

model Donation {
  donor   User?   @relation(fields: [donorId], references: [id])
  donorId String?          // La clé étrangère (nullable car don anonyme possible)
}
```

La syntaxe `@relation(fields: [donorId], references: [id])` dit :
"La colonne `donorId` dans Donation pointe vers la colonne `id` dans User."

### Qu'est-ce qu'une migration ?

Une migration c'est un fichier SQL généré automatiquement qui décrit comment
**faire évoluer ta base de données**. Si tu ajoutes une colonne `phone` à User,
Prisma génère le SQL `ALTER TABLE "User" ADD COLUMN "phone" TEXT;` et l'applique.

```bash
npx prisma migrate dev --name add-phone-to-user
```

**Ne jamais modifier la base à la main** — tout passe par les migrations pour que
l'environnement de prod et de dev restent synchronisés.

---

## CHAPITRE 3 — Authentification : JWT + Passport

### Le problème de l'auth HTTP

HTTP est **stateless** : chaque requête est indépendante. Le serveur ne se souvient
pas que tu t'es connecté à la requête précédente. Deux solutions classiques :

1. **Sessions** : le serveur stocke en mémoire/Redis qui est connecté. Problème : ne passe
   pas à l'échelle sur plusieurs serveurs.
2. **JWT (JSON Web Token)** : le serveur génère un token signé que le client stocke et
   renvoie à chaque requête. Le serveur n'a rien à stocker.

### Anatomie d'un JWT

Un JWT est une chaîne en 3 parties séparées par des points : `header.payload.signature`

```
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyXzEyMyIsInJvbGUiOiJET05PUiJ9.xK8...
         ↑                           ↑                              ↑
      En-tête                    Payload                        Signature
  (algo utilisé)           (données publiques)           (prouve l'authenticité)
```

Le payload contient par exemple `{ sub: "user_123", role: "DONOR", exp: 1735689600 }`.
La signature est calculée avec une clé secrète connue seulement du serveur.

**Quand le client envoie le token**, le serveur vérifie la signature. Si elle est valide,
il sait que c'est lui qui a créé ce token et que les données n'ont pas été modifiées.

### Passport.js : le système de stratégies

Passport est un middleware d'authentification pour Node.js. Il fonctionne par **stratégies** :
chaque stratégie est une façon de s'authentifier.

```
passport-jwt     → "Valide un token JWT dans le header Authorization"
passport-google  → "Valide un code OAuth2 de Google"
passport-apple   → "Valide un token Apple Sign-In"
```

Dans NestJS, chaque stratégie devient un `@Injectable()` :

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    })
  }

  // Cette méthode est appelée si le token est valide
  // Ce qu'elle retourne est injecté dans req.user
  async validate(payload: { sub: string; role: string }) {
    return { id: payload.sub, role: payload.role }
  }
}
```

### Les Guards NestJS

Un Guard répond à une seule question : **est-ce que cette requête peut continuer ?**

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
// Si le JWT est invalide → 401 Unauthorized automatiquement
```

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<Role[]>('roles', context.getHandler())
    const user = context.switchToHttp().getRequest().user
    return requiredRoles.includes(user.role)
    // false → 403 Forbidden automatiquement
  }
}
```

---

## CHAPITRE 4 — Paiements : abstraction multi-fournisseurs

### Pourquoi plusieurs fournisseurs de paiement ?

Les utilisateurs sont en Afrique et en Europe. Stripe et PayPal sont dominants en Europe.
En Afrique de l'Ouest, FedaPay et MTN Mobile Money sont les méthodes préférées.
Un seul fournisseur exclurait une partie des donateurs.

### Le pattern "Provider" (abstraction)

Au lieu d'appeler Stripe directement dans le service de dons, on crée une **couche d'abstraction** :

```typescript
// Interface commune pour tous les fournisseurs
interface PaymentProvider {
  createPaymentIntent(amount: number, currency: string): Promise<PaymentIntent>
  confirmPayment(paymentIntentId: string): Promise<Payment>
  refund(paymentId: string, amount?: number): Promise<Refund>
}

// Chaque fournisseur implémente l'interface
class StripeProvider implements PaymentProvider { ... }
class FedaPayProvider implements PaymentProvider { ... }
class MtnProvider implements PaymentProvider { ... }

// Le service payments choisit le bon provider
class PaymentsService {
  getProvider(method: PaymentMethod): PaymentProvider {
    switch(method) {
      case 'STRIPE': return this.stripeProvider
      case 'FEDAPAY': return this.fedaPayProvider
      case 'MTN': return this.mtnProvider
    }
  }
}
```

**Avantage** : si demain tu veux ajouter Wave ou Orange Money, tu crées juste un nouveau
provider sans toucher au reste du code.

### Les Webhooks : comment le paiement confirme le don

Quand un utilisateur paye, voici ce qui se passe :

```
1. Client → Backend : "Je veux faire un don de 50€ par Stripe"
2. Backend → Stripe : "Crée un PaymentIntent de 50€"
3. Stripe → Backend : "Voici un client_secret"
4. Backend → Client : "Voici le client_secret, finalise le paiement côté client"
5. Client → Stripe : "Je confirme avec ma carte XXXX"
6. Stripe → Backend (webhook) : "Le paiement payment_xxx est confirmé !"
7. Backend : Met à jour le don en CONFIRMED, envoie le reçu fiscal
```

Le webhook est crucial : c'est Stripe qui appelle ton backend pour confirmer.
Tu ne dois **jamais** confirmer un don basé uniquement sur ce que le client t'envoie
(le client pourrait mentir). Tu attends toujours la confirmation du fournisseur de paiement.

---

## CHAPITRE 5 — Files d'attente : Redis + Bull

### Pourquoi des queues ?

Certaines opérations sont **lentes** et ne doivent pas bloquer la réponse HTTP :
- Générer un PDF (Puppeteer prend 2-3 secondes)
- Envoyer un email (appel réseau vers SendGrid)
- Envoyer une notification push (appel réseau vers Firebase)

Si tu fais tout ça de manière synchrone dans ton controller, l'utilisateur attend 5 secondes.
La solution : **mettre la tâche en file d'attente** et répondre immédiatement.

```
Requête HTTP → Controller → Ajoute tâche dans la queue → Répond "OK 200" immédiatement
                                        ↓
                               Worker (en arrière-plan) traite la tâche
                               → Génère le PDF
                               → Envoie l'email
```

### Redis comme backend de queue

Redis est une base de données **en mémoire**, extrêmement rapide. Bull utilise Redis
pour stocker les jobs en attente, en cours, et terminés.

```typescript
// Ajouter un job dans la queue
await this.notificationQueue.add('send-email', {
  to: user.email,
  subject: 'Votre reçu fiscal',
  donationId: donation.id,
})

// Processor qui traite les jobs (s'exécute en arrière-plan)
@Processor('notifications')
export class NotificationsProcessor {
  @Process('send-email')
  async handleSendEmail(job: Job<{ to: string; subject: string; donationId: string }>) {
    // Génère le PDF, envoie l'email...
  }
}
```

---

## CHAPITRE 6 — Temps réel : Socket.io

### Pourquoi du temps réel pour les campagnes ?

Imagine une campagne à 10 000€ avec une barre de progression.
Quand un utilisateur fait un don, tous les autres visiteurs doivent voir la barre avancer.
Avec HTTP classique (polling), le client devrait demander toutes les 5 secondes :
"La barre a changé ?". C'est inefficace.

Avec **WebSockets** (Socket.io), le serveur **pousse** les mises à jour en temps réel :

```
Serveur → Client A : "La campagne XYZ est maintenant à 7500€ (75%)"
Serveur → Client B : "La campagne XYZ est maintenant à 7500€ (75%)"
```

### Rooms Socket.io

Socket.io utilise des **rooms** pour grouper les connexions. Un client qui visite
la page d'une campagne rejoint la room de cette campagne :

```typescript
// Côté client
socket.emit('join-campaign', 'campaign_abc')

// Côté serveur
@SubscribeMessage('join-campaign')
handleJoin(@ConnectedSocket() client: Socket, @MessageBody() campaignId: string) {
  client.join(`campaign:${campaignId}`)
}

// Quand un don est confirmé
this.server.to(`campaign:${campaignId}`).emit('campaign-updated', {
  raised: 7500,
  percentage: 75,
})
```

---

## CHAPITRE 7 — Variables d'environnement et configuration

### Pourquoi ne jamais mettre les secrets dans le code ?

Si tu écris `const STRIPE_KEY = "sk_live_xxxx"` dans ton code et que tu push sur GitHub,
n'importe qui peut voler ta clé et débiter ta carte. Les secrets doivent être dans
des **variables d'environnement** (.env) qui ne sont jamais commitées.

### Validation avec Zod

On valide les variables d'env au démarrage pour éviter les surprises :

```typescript
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  PORT: z.coerce.number().default(3000),
})

// Si une variable manque ou est invalide → le serveur refuse de démarrer
export const env = envSchema.parse(process.env)
```

C'est bien mieux que de découvrir au runtime que `process.env.STRIPE_SECRET_KEY` est
`undefined` et que tous les paiements échouent.

---

## CHAPITRE 8 — Sécurité

### Helmet

Helmet configure automatiquement des **headers HTTP sécurisés** :
- `X-Content-Type-Options: nosniff` → empêche le navigateur de deviner le type de fichier
- `X-Frame-Options: DENY` → empêche d'intégrer ton site dans une iframe (clickjacking)
- `Content-Security-Policy` → contrôle d'où les ressources peuvent être chargées

```typescript
app.use(helmet())  // Une ligne, des dizaines de protections
```

### Rate Limiting

Sans rate limiting, un attaquant peut envoyer 10 000 requêtes de connexion par seconde
pour deviner des mots de passe (brute force). Le rate limit bloque ça :

```typescript
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,  // fenêtre de 15 minutes
  max: 100,                   // max 100 requêtes par IP par fenêtre
}))
```

### RGPD

Le RGPD (règlement européen sur les données personnelles) impose :
- De permettre à l'utilisateur de **supprimer son compte et ses données**
- De ne pas stocker plus de données que nécessaire
- D'avoir une politique de confidentialité claire

Dans notre app : les dons anonymes permettent de respecter la vie privée,
et on doit prévoir un endpoint `DELETE /me` qui supprime toutes les données.

---

## Glossaire rapide

| Terme | Définition |
|-------|-----------|
| **DTO** | Data Transfer Object — classe qui définit la forme des données reçues/envoyées |
| **Guard** | Middleware NestJS qui bloque ou autorise une requête |
| **Decorator** | Annotation TypeScript qui ajoute un comportement à une classe/méthode |
| **Webhook** | URL que tu exposes pour que des services externes (Stripe, etc.) t'appellent |
| **JWT** | Token signé contenant des infos sur l'utilisateur connecté |
| **Migration** | Fichier SQL versionné qui fait évoluer le schéma de la base |
| **Queue** | File d'attente pour traiter des tâches lourdes en arrière-plan |
| **WebSocket** | Connexion persistante bidirectionnelle entre client et serveur |
| **ACID** | Propriétés garantissant la fiabilité des transactions en base de données |
| **CORS** | Cross-Origin Resource Sharing — contrôle quels domaines peuvent appeler l'API |
| **RGPD** | Réglementation sur la protection des données personnelles en Europe |
| **Provider** | Pattern de conception — couche d'abstraction sur une dépendance externe |
