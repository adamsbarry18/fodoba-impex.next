# Fodoba - Référence complète

## Structure `src/`

| Dossier | Rôle |
|---------|------|
| `src/app/` | Routes (`login`, `forgot-password`, `(dashboard)/*`) |
| `src/services/` | Couche métier Firestore |
| `src/lib/contexts/` | Auth, Store, Currency, Notifications |
| `src/lib/types.ts` | Types + schémas Zod |
| `src/lib/auth/permissions.ts` | Matrice RBAC |
| `src/lib/navigation/` | `app-nav.ts` (menu), `return-to.ts` (retour création entité) |
| `src/lib/*-utils.ts` | Helpers métier par domaine (voir liste ci-dessous) |
| `src/lib/firebase/` | Config + client (`client.ts`) |
| `src/components/` | layout, auth, pos, cash, notifications, `ui/` shadcn |
| `src/hooks/` | permissions, currency, barcode, create-return |

### Utils métier (`src/lib/`)

`auth-utils` · `audit-utils` · `cash-session-utils` · `category-utils` · `client-utils` · `currency-utils` · `dashboard-utils` · `expense-utils` · `landed-cost-utils` · `notification-utils` · `pos-utils` · `product-utils` · `purchase-utils` · `report-utils` · `stock-movement-utils` · `store-utils` · `supplier-utils` · `user-utils` · `badge-tones.ts`

## Providers (ordre fixe)

`AuthProvider` → `CurrencyProvider` → `StoreProvider` → `NotificationProvider` → `AuthLayoutWrapper`

Fichier : `src/app/layout.tsx`

## Conventions

- Routes : anglais kebab-case (`/inventory/transfers/new`, `/reconciliation`)
- Rôles Firestore : `"admin"`, `"manager"`, `"seller"` (lowercase)
- Permissions : `"action:ressource"` - `permissions.ts`
- Services : `{Domain}Service` dans `{domain}.service.ts`
- Champs mixtes : `nom`/`prenom`/`boutiqueIds` (profil) vs `storeId`/`activeStore` (contexte)
- localStorage boutique : clé `activeStoreId`
- Devise référence comptable : **FCFA** ; aussi GNF, USD, EUR via `currencies`

## Firebase

### Import

```tsx
import { app, auth, db } from '@/lib/firebase/client';
```

Config : `NEXT_PUBLIC_FIREBASE_*` - `.env.example` → `.env.local`

### Pattern données

- Collections **plates** (pas de sous-collections par boutique)
- Scoping : champ `storeId` + `useStore().activeStore`
- Stock composite : doc ID `{storeId}_{productId}`
- Chargement : `useEffect` + appels `XxxService`, pas de hooks `useCollection`

### Règles de sécurité (`firestore.rules`)

À publier dans Firebase Console (remplacer la règle temporaire `/{document=**}`).

| Helper | Rôle |
|--------|------|
| `isSignedIn()` | Utilisateur authentifié |
| `isActif()` | Profil `users/{uid}` avec `actif == true` |
| `isAdmin()` / `isManager()` | Rôle dans le profil |
| `isStoreAuthorized(storeId)` | Admin ou `storeId in boutiqueIds` |
| `isSelfProfileUpdate(userId)` | Auto-édition : `prenom`, `nom`, `phone`, `photoURL` |

**Impact requêtes client** : si une règle lit `resource.data.storeId`, la requête Firestore **doit** filtrer par `storeId` (sinon `permission-denied`). Exemple corrigé : `CashService.getMovements(sessionId, storeId)`.

Collections couvertes : `users`, `stores`, `products`, `categories`, `stocks`, `inventory_movements`, `sales`, `expenses`, `cash_sessions`, `cash_movements`, `purchases`, `clients`, `client_payments`, `suppliers`, `currencies`, `audit_logs`, `notifications`.

### Collections

| Collection | Service | Usage |
|------------|---------|-------|
| `users` | `user.service.ts` | Profils collaborateurs |
| `stores` | `store.service.ts` | Boutiques |
| `categories`, `products` | `category.service.ts`, `product.service.ts` | Catalogue global |
| `stocks` | `product.service.ts` | Niveaux par boutique |
| `inventory_movements` | `inventory.service.ts` | Historique stock |
| `clients`, `client_payments` | `client.service.ts` | Clients + paiements |
| `suppliers`, `purchases` | `supplier.service.ts`, `purchase.service.ts` | Achats import |
| `sales` | `sale.service.ts` | Ventes POS |
| `expenses` | `expense.service.ts` | Dépenses boutique |
| `cash_sessions`, `cash_movements` | `cash.service.ts` | Caisse |
| `currencies` | `currency.service.ts` | Taux de change |
| `notifications` | `notification.service.ts` | Alertes in-app |
| `audit_logs` | `user.service.ts`, `audit.service.ts` | Journal audit |

### Services (`src/services/`)

`auth`, `user`, `store`, `category`, `product`, `inventory`, `client`, `supplier`, `purchase`, `sale`, `cash`, `expense`, `currency`, `notification`, `report`, `print`, `audit`

Pattern :

```tsx
export const ProductService = {
  async listProducts(...) { /* getDocs, tri mémoire si filtres */ },
  async createProduct(...) { /* setDoc + serverTimestamp */ },
};
```

### Transactions

`runTransaction` dans ventes, achats, stock :
1. **Toutes les reads avant writes**
2. **Pas de query dans la transaction** (ex. session caisse lue avant `runTransaction`)
3. Stock ID : `doc(db, 'stocks', `${storeId}_${productId}`)`

### Auth

- Erreurs FR : `mapAuthErrorCode()` - `auth-utils.ts` / `AuthService.handleAuthError()`
- Bootstrap : premier user → admin auto si `users` vide - `AuthContext.tsx`
- Création collaborateur : app Firebase secondaire - `UserService.createCollaborator`
- Profil personnel : `UserService.updateOwnProfile()` (champs limités, règle Firestore)

### Index Firestore

Éviter `where` + `orderBy` composites quand possible - tri/filtre en mémoire. Préférer filtre `storeId` seul + filtre client si besoin.

## Contextes & hooks

| Hook | Usage |
|------|-------|
| `useAuth()` | user, rôle, login/logout, `refreshProfile` |
| `useStore()` | `activeStore`, `availableStores`, `setActiveStoreById` |
| `useCurrency()` | taux, `formatAmount`, conversion FCFA |
| `useNotifications()` | abonnement Firestore `onSnapshot` |
| `usePermissions()` | `can('action:ressource')`, `canAny()` |

Admin/Manager voient toutes les boutiques ; seller limité à `boutiqueIds`.

## RBAC

Rôles et permissions dans `src/lib/auth/permissions.ts`.

| Rôle | Exemples permissions |
|------|---------------------|
| `admin` | `manage:stores`, `manage:users`, `view:reports:global`, `access:admin:panel` |
| `manager` | `manage:catalog`, `manage:purchases`, `manage:transfers`, `view:reports:cash` |
| `seller` | `create:sale`, `view:stock`, `reconcile:cash`, `manage:expenses` |

Garde UI : `RoleGuard` - `src/components/auth/role-guard.tsx`  
Nav : `APP_NAVIGATION` - `src/lib/navigation/app-nav.ts`, filtrée par `usePermissions()`

## UI

### Layout dashboard

Route group `(dashboard)/layout.tsx` :  
`SidebarProvider` → `AppSidebar` + `AppHeader` + carte scrollable `max-w-[1600px]`

Auth guard : `auth-layout-wrapper.tsx` (redirect `/login`).

### Composants transverses

| Composant | Fichier |
|-----------|---------|
| `StatusBadge` | `components/ui/status-badge.tsx` + `badge-tones.ts` |
| `UserAvatar` | `components/ui/user-avatar.tsx` |
| `LoadingScreen` | `components/ui/loading-screen.tsx` |
| `AuthPageShell` | `components/auth/auth-page-shell.tsx` |
| `NotificationPanel` | `components/notifications/notification-panel.tsx` |
| `PaymentDialog` | `components/pos/payment-dialog.tsx` |
| Menu sidebar/header | `nav-menu-items.tsx`, `app-sidebar.tsx`, `app-header.tsx` |

### Style

- `lang="fr"`, accent vert `#1DD97C` (`--primary`)
- Fonts : Inter (body), Space Grotesk (`font-headline`)
- Cartes : `rounded-2xl border bg-card shadow-sm`
- Montants : `formatAmount(x, "FCFA")`

### Toasts

```tsx
import { toast } from "sonner";
toast.success("Vente enregistrée");
toast.error("Erreur lors de l'enregistrement");
```

### Formulaires

**CRUD** : `useForm` + `zodResolver` + schéma Zod  
**Flux transactionnels** (POS, paiement) : `useState` manuel acceptable

### Listes

`useState` + pagination `lastVisible`/`hasMore` via services.

## Domaines métier

### POS / Ventes

- Page : `pos/page.tsx` · utils : `pos-utils.ts`
- Service : `SaleService.processSale()`
- Prérequis : session caisse ouverte
- Paiement : `PaymentDialog` + `payment-methods.ts`

### Caisse

- `cash.service.ts` - sessions, mouvements, clôture
- Page : `reconciliation/page.tsx` · utils : `cash-session-utils.ts`
- **Requête mouvements** : filtre `storeId` obligatoire (règles Firestore)

### Achats / Stock / Rapports

- Achats : `purchases/`, `purchase.service.ts`, `landed-cost/`
- Stock : `inventory/`, `inventory.service.ts`, transferts `inventory/transfers/new`
- Rapports : `report.service.ts`, `reports/*`, PDF `print.service.ts`

### Notifications & audit

- Panel : `notification-panel.tsx` · utils : `notification-utils.ts`
- Audit admin : `admin/audit/page.tsx` · `audit.service.ts`, `audit-utils.ts`

## Routes principales

| Route | Module |
|-------|--------|
| `/dashboard` | Tableau de bord |
| `/pos` | Point de vente |
| `/inventory`, `/inventory/history` | Stock & flux |
| `/purchases`, `/landed-cost` | Achats & coût revient |
| `/clients`, `/suppliers` | Tiers |
| `/expenses` | Dépenses |
| `/reconciliation` | Caisse |
| `/reports/*` | Rapports |
| `/admin/*` | Paramètres système |
| `/profile` | Profil utilisateur |

## CI/CD

- Push/PR `main`/`dev` → `validate` (lint + typecheck + build)
- Déploiement Vercel : `workflow_dispatch` - `.github/workflows/ci-cd.yml`

## Documentation projet

| Fichier | Rôle |
|---------|------|
| `README.md` | Setup, architecture, déploiement |
| `.env.example` | Variables Firebase |
| `firestore.rules` | Règles sécurité Firestore |
| `docs/cahier_de_charges.md` | CDC v1.0 - source métier |
| `docs/blueprint.md` | Spec produit |
| `.cursor/skills/fodoba/` | Conventions agents IA |
| `.cursor/rules/` | Règles Cursor (code + documentation) |

Le **code fait foi** techniquement ; le **CDC** pour les règles métier.  
Offline/IndexedDB : aspirational, non implémenté dans `src/`.

## Différences vs Hoolo / Cashflow

| | Fodoba | Hoolo | Cashflow |
|---|--------|-------|----------|
| Import Firebase | `@/lib/firebase/client` | `@/firebase` | `@/firebase` |
| Data scope | `storeId` + collections plates | `boutiques/{id}/` | collections plates |
| Services | couche `src/services/` | `firebase/services/` | inline pages |
| Realtime | notifications only | `useCollection` partout | `useCollection` |
| Notifications | Firestore | localStorage | N/A |
| Devise ref | FCFA | GNF | EUR+GNF |
| Formulaires | RHF+zod (CRUD) | useState | useState |
| Toasts | sonner | sonner + Radix | Radix |
