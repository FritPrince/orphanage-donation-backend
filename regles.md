# Règles & Conventions — Backend NestJS

Standards appliqués sur le projet fintech-app. À respecter sur tous les projets NestJS.

---

## 1. Qualité du code

### DRY — Don't Repeat Yourself
- Toute logique dupliquée doit être extraite dans un service, un utilitaire ou un helper avant d'écrire une deuxième copie.
- Si deux modules ont besoin du même traitement, il va dans `common/`.

### Zéro code mort
- Aucune variable, import, fonction ou fichier inutilisé.
- Si quelque chose n'a plus d'appelant actif, on le supprime. Pas de `// unused`, pas de `_var`.

### Pas de valeurs en dur
- Toutes les constantes métier vont dans un fichier `constants/` typé et exporté.
- Toute config, URL, secret ou magic number passe par `ConfigService` ou une constante nommée.

```typescript
// ✅ Correct
export const BCRYPT_ROUNDS = 12;
export const RESET_TOKEN_EXPIRY_HOURS = 1;

// ❌ Interdit
await bcrypt.hash(password, 12);
```

### Pas de commentaires inutiles
- On ne commente pas CE QUE fait le code (les noms le disent déjà).
- On commente uniquement le POURQUOI quand c'est non-évident : contrainte cachée, workaround, invariant subtil.
- Jamais de blocs multi-lignes ou de docstrings longs.

---

## 2. Typage TypeScript

### Interdiction du `any`
- Chaque valeur, paramètre et type de retour doit être explicitement typé.
- Pas de types implicites sur les surfaces d'API publiques.

```typescript
// ✅ Correct
async login(userId: string): Promise<LoginResponseDto>

// ❌ Interdit
async login(userId): Promise<any>
```

### DTOs obligatoires
- Toute entrée contrôleur passe par un DTO décoré avec `class-validator`.
- Pas de `body: any`, pas d'objet brut.
- Chaque propriété porte ses décorateurs de validation ET ses décorateurs Swagger.

```typescript
export class LoginDto {
  @ApiProperty({ example: 'admin@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}
```

---

## 3. Nommage

### Langue
- **Anglais uniquement** pour tout identifiant : variables, fonctions, classes, paramètres, constantes, noms de fichiers.
- Le français est réservé aux chaînes affichées à l'utilisateur final et aux descriptions Swagger/documentation.

### Conventions par type

| Type | Convention | Exemple |
|------|-----------|---------|
| Fichiers | `kebab-case` | `create-transaction.dto.ts` |
| Classes / DTOs | `PascalCase` | `CreateTransactionDto` |
| Méthodes / variables | `camelCase` | `createTransaction()` |
| Constantes | `SCREAMING_SNAKE_CASE` | `MAX_RETRY_COUNT` |
| Colonnes DB | `snake_case` via `@map` Prisma | `password_hash` → `passwordHash` |
| Tables DB | `snake_case` via `@@map` Prisma | `@@map("users")` |

---

## 4. Architecture NestJS

### Structure des dossiers

```
apps/backend/src/
├── modules/          # Un dossier par domaine métier
├── common/           # Guards, décorateurs, filtres, intercepteurs partagés
└── infrastructure/   # Adaptateurs techniques (Prisma, events, mailer…)
```

### Anatomie minimale d'un module

```
modules/<name>/
├── <name>.module.ts
├── <name>.controller.ts
├── <name>.service.ts
└── dto/
    ├── create-<name>.dto.ts
    ├── <name>-response.dto.ts
    └── index.ts
```

### Règles d'architecture

- **Un module par domaine** — pas de logique métier cross-domaine.
- **Les services portent la logique** — le contrôleur ne fait que du HTTP (récupérer les params, appeler le service, renvoyer).
- **PrismaService par injection uniquement** — ne jamais instancier `PrismaClient` directement dans un module.
- **Pas de SQL brut** — API Prisma exclusivement.
- **Barrel exports** — chaque dossier expose un `index.ts` qui ré-exporte ses membres.
- **Préfixe global `api/v1`** — défini une seule fois dans `main.ts`, jamais réécrasé au niveau module.

---

## 5. Contrôleurs

### Swagger obligatoire sur chaque route

Chaque méthode de contrôleur doit avoir :

```typescript
@ApiTags('NomDuModule')
@ApiBearerAuth('access-token')         // si route protégée
@ApiOperation({ summary: '...' })
@ApiResponse({ status: 200, ... })     // tous les codes possibles
@ApiResponse({ status: 401, ... })
@ApiResponse({ status: 403, ... })
@ApiResponse({ status: 404, ... })
```

### Modèle de contrôleur complet

```typescript
@ApiTags('Transactions')
@ApiBearerAuth('access-token')
@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a transaction' })
  @ApiWrappedResponse({ type: TransactionResponseDto, status: 201 })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'No access to this company' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  create(
    @Body() dto: CreateTransactionDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.create(dto, user.sub, user.role);
  }
}
```

---

## 6. Services

### Injection de dépendances

```typescript
@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}
}
```

### Gestion des erreurs

- Utiliser les exceptions NestJS standard : `NotFoundException`, `ForbiddenException`, `BadRequestException`, `ConflictException`, `UnauthorizedException`.
- Ne jamais lancer une erreur générique `new Error(...)` depuis un service.
- Toujours vérifier l'accès avant de retourner des données.

```typescript
const account = await this.prisma.account.findFirst({ where: { id, isDeleted: false } });
if (!account) throw new NotFoundException('Account not found');
```

### Soft delete

- Toute suppression est logique : `isDeleted: true`, jamais `deleteMany` / `delete` en production.
- Tous les `findMany` / `findFirst` / `findUnique` filtrent sur `isDeleted: false`.

---

## 7. Base de données (Prisma)

### Schéma

- IDs : `String @id @default(uuid())`.
- Dates : `createdAt DateTime @default(now()) @map("created_at")`.
- Colonnes DB en `snake_case`, champs Prisma en `camelCase` via `@map`.
- Tables en `snake_case` via `@@map`.
- Booléens soft-delete : `isDeleted Boolean @default(false) @map("is_deleted")`.

### Transactions Prisma

Toute opération qui touche plusieurs tables s'exécute dans `prisma.$transaction()` :

```typescript
const result = await this.prisma.$transaction(async (tx) => {
  await tx.account.update({ ... });
  return tx.transaction.create({ ... });
});
```

### Arithmétique financière

- Utiliser `Prisma.Decimal` pour tous les montants, jamais `number` ou `float`.

```typescript
const amount = new Prisma.Decimal(dto.amount);
const newBalance = account.balance.add(amount);
```

---

## 8. Authentification & Sécurité

### JWT

- Access token : durée courte (8h), signé avec `JWT_ACCESS_SECRET`.
- Refresh token : durée longue (7j), signé avec `JWT_REFRESH_SECRET`, hashé en base.
- Le hash en base suit le même principe que les mots de passe (bcrypt).

### Guards

```typescript
// Route protégée (utilisateur connecté)
@UseGuards(JwtAuthGuard)

// Route réservée à l'admin
@Roles(Role.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
```

### Mots de passe

- Hashage bcrypt avec `BCRYPT_ROUNDS = 12`.
- Jamais stocker ou logger un mot de passe en clair.
- Token de reset : `crypto.randomBytes(32).toString('hex')` — 64 caractères hexadécimaux.

### ValidationPipe global

Configuré dans `main.ts` avec :
```typescript
new ValidationPipe({
  whitelist: true,            // supprime les champs non déclarés dans le DTO
  forbidNonWhitelisted: true, // rejette la requête si champ inconnu
  transform: true,            // transforme automatiquement les types
})
```

---

## 9. Format des réponses

### Enveloppe succès (automatique via `TransformInterceptor`)

```json
{
  "data": { ... },
  "timestamp": "2026-04-24T10:00:00.000Z"
}
```

### Format d'erreur (automatique via `GlobalHttpExceptionFilter`)

```json
{
  "statusCode": 400,
  "timestamp": "2026-04-24T10:00:00.000Z",
  "path": "/api/v1/auth/login",
  "message": "..."
}
```

### Règle d'enregistrement

- `GlobalHttpExceptionFilter` → enregistré une seule fois dans `main.ts` via `app.useGlobalFilters()`.
- `TransformInterceptor` + `LoggingInterceptor` → enregistrés une seule fois dans `main.ts` via `app.useGlobalInterceptors()`.
- Ne jamais les ré-enregistrer dans un module ou contrôleur.

---

## 10. Tests unitaires

### Structure minimale

```typescript
describe('AuthService', () => {
  let service: AuthService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockDeep<PrismaService>() },
      ],
    }).compile();

    service = module.get(AuthService);
    prisma = module.get(PrismaService);
  });
});
```

### Couverture attendue

- Chaque méthode de service a au moins un test de cas nominal et un test de cas d'erreur.
- Les cas limites (ressource introuvable, accès refusé, doublon) sont tous testés.

### Configuration ts-jest

Le fichier `tsconfig.test.json` est distinct de `tsconfig.json` pour la compatibilité ts-jest :

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "node",
    "resolvePackageJsonExports": false,
    "resolvePackageJsonImports": false
  }
}
```

---

## 11. Variables d'environnement

### Fichier `.env.example` obligatoire

```env
DATABASE_URL=mysql://user:password@localhost:3306/fintech_db
PORT=3000
JWT_ACCESS_SECRET=change_this_access_secret_in_production
JWT_ACCESS_EXPIRES_IN=8h
JWT_REFRESH_SECRET=change_this_refresh_secret_in_production
JWT_REFRESH_EXPIRES_IN=7d
```

### Règles

- `.env` est **toujours dans `.gitignore`**, jamais committé.
- `.env.example` est committé avec des valeurs fictives.
- Accès via `ConfigService.getOrThrow<string>('KEY')` — jamais `process.env.KEY` dans le code métier (sauf `main.ts` et `PrismaService` où DI n'est pas encore disponible).

---

## 12. Git & GitLab

### Branches

- `master` est protégé — pas de push direct.
- Développement sur `feature/<nom>` ou `fix/<nom>`.
- Merges via Merge Request uniquement.

### Commits

- Messages en anglais, impératif, concis : `Add transaction filter by date`, `Fix roles guard nested array`.
- Un commit = une unité logique de changement.

### `.gitignore` obligatoire

```
.env
.env.*
!.env.example
node_modules/
dist/
*.tsbuildinfo
```

---

## 13. Prettier

Configuration `.prettierrc` :

```json
{
  "singleQuote": true,
  "trailingComma": "all"
}
```

Règles appliquées :
- Guillemets simples partout.
- Virgule trailing sur les derniers éléments d'objets, tableaux et paramètres.
- Une propriété par ligne dans les objets multi-lignes — pas d'alignement par espaces.
- Pas de double-espace pour aligner verticalement des valeurs.

---

## 14. Documentation Postman

### Structure de la collection

- Variables de collection : `baseUrl`, `accessToken`, `refreshToken`, `userId`, `companyId`, `accountId`, `transactionId`, `declarationId`.
- Un dossier par module (AUTHENTIFICATION, ENTREPRISES, UTILISATEURS…).
- Chaque requête a une description complète : informations générales, corps, exemple de réponse, codes de réponse.

### Capture automatique des tokens

Script de test sur `POST /auth/login` :

```javascript
const jsonData = pm.response.json();
pm.environment.set('accessToken', jsonData.data.accessToken);
pm.environment.set('refreshToken', jsonData.data.refreshToken);
```

### Utilisation du token dans les requêtes

Header Authorization : `Bearer {{accessToken}}` (variable d'environnement, pas en dur).

---

## 15. Processus de travail

- **Expliquer avant d'implémenter** : décrire l'approche, le flux de données et les compromis avant d'écrire du code.
- **Suivre la documentation officielle** : NestJS, Prisma, class-validator, Swagger — patterns idiomatiques, pas de contournements.
- **Pas d'abstraction prématurée** : trois lignes similaires valent mieux qu'une abstraction inutile. On refactorise quand le besoin est réel.
- **Pas de gestion d'erreur fantôme** : ne pas valider des cas qui ne peuvent pas arriver. Faire confiance au framework et aux garanties internes.
