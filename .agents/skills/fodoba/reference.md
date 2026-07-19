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
| `src/lib/constants/` | Constantes partagées (`payment-methods`, `branding`, …) |
| `src/lib/firebase/` | Config + client (`client.ts`) |
| `src/i18n/` | Config locale, messages JSON, provider, `nestMessages` |
| `src/components/` | layout, auth, pos, cash, notifications, `ui/` shadcn |
| `src/hooks/` | permissions, currency, barcode, i18n helpers, create-return |

### Utils métier (`src/lib/`)

`auth-utils` · `audit-utils` · `cash-session-utils` · `category-utils` · `client-utils` · `currency-utils` · `dashboard-utils` · `expense-utils` · `landed-cost-utils` · `notification-utils` · `pos-utils` · `product-utils` · `purchase-utils` · `report-utils` · `stock-movement-utils` · `store-utils` · `supplier-utils` · `user-utils` · `badge-tones.ts`

## Providers (ordre fixe)

`I18nProvider` → `AuthProvider` → `CurrencyProvider` → `StoreProvider` → `NotificationProvider` → `AuthLayoutWrapper`

Fichier : `src/app/layout.tsx`

## Internationalisation (i18n)

| Élément | Fichier / usage |
|---------|-----------------|
| Langues | `fr` (défaut), `en`, `pt` - `src/i18n/config.ts` |
| Persistance | `localStorage` clé `fodoba-locale` |
| Messages | `src/i18n/messages/{fr,en,pt}.json` (~1500 clés, format plat `"module.key"`) |
| Conversion | `nestMessages()` - plat → imbriqué pour next-intl v4+ |
| Provider | `I18nProvider` + `NextIntlClientProvider` - `src/i18n/context.tsx` |
| Traduction UI | `const t = useT()` → `t("common.save")` |
| Locale | `useLocale()` → `{ locale, setLocale }` (sélecteur dans `app-header.tsx`) |
| Rich text | `t.rich("key", { store: name, strong: (c) => <strong>{c}</strong> })` |
| Pluriels | ICU dans JSON : `{count, plural, one {# item} other {# items}}` |
| Colonnes table | `useTranslatedTableColumns(tableKey, columns, labelKeys)` |
| Modes paiement | `usePaymentMethodLabel()` ou `t(getPaymentMethodLabel(id))` |
| Badges preset | `StatusBadge preset="…" value="…"` sans `children` (traduit via `badge-tones.ts`) |
| Hors React | `getAppName()`, `getPaymentMethodLabelFr()` - `src/lib/constants/` |
| PDF | `print.service.ts` utilise `getAppName()` ; corps des PDF encore majoritairement FR |

### Namespaces courants

`common.*` · `nav.*` · `header.*` · `badges.*` · `payment.*` · par module (`purchases.*`, `inventory.*`, `reconciliation.*`, …)

### Ajouter une traduction

1. Ajouter la clé dans **fr.json, en.json et pt.json** (même clé, texte adapté)
2. Dans le composant client : `import { useT } from "@/i18n/context"` puis `t("module.key")`
3. Si variable : `t("module.key", { name: value })` - ne pas oublier les paramètres requis
4. `npm run typecheck`

## Conventions

- Routes : anglais kebab-case (`/inventory/transfers/new`, `/reconciliation`)
- Rôles Firestore : `"admin"`, `"manager"`, `"seller"` (lowercase)
- Permissions : `"action:ressource"` - `permissions.ts`
- Services : `{Domain}Service` dans `{domain}.service.ts`
- Champs mixtes : `nom`/`prenom`/`boutiqueIds` (profil) vs `storeId`/`activeStore` (contexte)
- localStorage boutique : clé `activeStoreId`
- Devise référence comptable : **FCFA** ; aussi GNF, USD, EUR via `currencies`
- UI : textes via i18n ; réponses agents IA au user en **français**

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

**Impact requêtes client** : si une règle lit `resource.data.storeId`, la requête Firestore **doit** filtrer par `storeId` (sinon `permission-denied`). Exemple : `CashService.getMovements(sessionId, storeId)`.

Collections couvertes : `users`, `stores`, `products`, `categories`, `stocks`, `inventory_movements`, `sales`, `expenses`, `cash_sessions`, `cash_movements`, `purchases`, `clients`, `client_payments`, `suppliers`, `supplier_payments`, `currencies`, `audit_logs`, `notifications`.

### Collections

| Collection | Service | Usage |
|------------|---------|-------|
| `users` | `user.service.ts` | Profils collaborateurs |
| `stores` | `store.service.ts` | Boutiques |
| `categories`, `products` | `category.service.ts`, `product.service.ts` | Catalogue global |
| `stocks` | `product.service.ts` | Niveaux par boutique |
| `inventory_movements` | `inventory.service.ts` | Historique stock |
| `clients`, `client_payments` | `client.service.ts` | Clients + paiements |
| `suppliers`, `supplier_payments`, `purchases` | `supplier.service.ts`, `purchase.service.ts` | Achats import |
| `sales` | `sale.service.ts` | Ventes POS |
| `expenses` | `expense.service.ts` | Dépenses boutique |
| `cash_sessions`, `cash_movements` | `cash.service.ts` | Caisse |
| `currencies` | `currency.service.ts` | Taux de change |
| `notifications` | `notification.service.ts` | Alertes in-app |
| `audit_logs` | `user.service.ts`, `audit.service.ts` | Journal audit |

### Services (`src/services/`)

`auth`, `user`, `store`, `category`, `product`, `inventory`, `client`, `supplier`, `purchase`, `sale`, `cash`, `expense`, `currency`, `notification`, `report`, `print`, `audit`

### Transactions

`runTransaction` dans ventes, achats, stock :
1. **Toutes les reads avant writes**
2. **Pas de query dans la transaction**
3. Stock ID : `doc(db, 'stocks', `${storeId}_${productId}`)`

### Auth

- Erreurs auth mappées via clés i18n - `auth-utils.ts` / `AuthService.handleAuthError()`
- Bootstrap : premier user → admin auto si `users` vide - `AuthContext.tsx`
- Création collaborateur : app Firebase secondaire - `UserService.createCollaborator`

## Contextes & hooks

| Hook | Usage |
|------|-------|
| `useT()` | Traductions UI (`next-intl`) |
| `useLocale()` | Langue active + `setLocale` |
| `useAuth()` | user, rôle, login/logout, `refreshProfile` |
| `useStore()` | `activeStore`, `availableStores`, `setActiveStoreById` |
| `useCurrency()` | taux, `formatAmount`, conversion FCFA |
| `useNotifications()` | abonnement Firestore `onSnapshot` |
| `usePermissions()` | `can('action:ressource')`, `canAny()` |
| `usePaymentMethodLabel()` | Libellé traduit d'un mode de paiement |
| `useTranslatedTableColumns()` | Colonnes de tableau traduites |

## RBAC

Rôles et permissions dans `src/lib/auth/permissions.ts`.

Garde UI : `RoleGuard` - `src/components/auth/role-guard.tsx`  
Nav : `APP_NAVIGATION` - clés `nav.*`, filtrée par `usePermissions()`

## UI

### Layout dashboard

Route group `(dashboard)/layout.tsx` :  
`SidebarProvider` → `AppSidebar` + `AppHeader` + carte scrollable `max-w-[1600px]`

Auth guard : `auth-layout-wrapper.tsx` (redirect `/login`).

### Composants transverses

| Composant | Fichier |
|-----------|---------|
| `StatusBadge` | `components/ui/status-badge.tsx` + `badge-tones.ts` |
| `TablePagination` / `TableColumnToggle` | traduits via `table.*` |
| `LoadingScreen` | `components/ui/loading-screen.tsx` |
| `AuthPageShell` | `components/auth/auth-page-shell.tsx` |
| Menu sidebar/header | `nav-menu-items.tsx`, `app-sidebar.tsx`, `app-header.tsx` |

### Style

- `document.documentElement.lang` mis à jour selon locale (`fr` / `en` / `pt`)
- Accent vert `#1DD97C` (`--primary`)
- Fonts : Inter (body), Space Grotesk (`font-headline`)
- Cartes : `rounded-2xl border bg-card shadow-sm`
- Montants : `formatAmount(x, "FCFA")`

### Toasts

```tsx
const t = useT();
toast.success(t("common.successUpdate"));
toast.error(t("common.error"));
```

### Formulaires

**CRUD** : `useForm` + `zodResolver` + schéma Zod (messages validation via `useMemo` + `t()`)  
**Flux transactionnels** (POS, paiement) : `useState` manuel acceptable

## Domaines métier

Voir routes : POS (`pos/`), Caisse (`reconciliation/`), Achats (`purchases/`), Stock (`inventory/`), Rapports (`reports/*`, `print.service.ts`).

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
| `README.md` | Setup, architecture, i18n, déploiement |
| `.env.example` | Variables Firebase |
| `firestore.rules` | Règles sécurité Firestore |
| `docs/cahier_de_charges.md` | CDC v1.0 - source métier |
| `docs/blueprint.md` | Spec produit |
| `.agents/skills/fodoba/` | Skill agent IA (conventions code) |
| `.agents/rules/` | Règles persistantes (code + documentation) |

Le **code fait foi** techniquement ; le **CDC** pour les règles métier.  
Offline/IndexedDB : aspirational, non implémenté dans `src/`.

## Différences vs Hoolo / Cashflow

| | Fodoba | Hoolo | Cashflow |
|---|--------|-------|----------|
| Import Firebase | `@/lib/firebase/client` | `@/firebase` | `@/firebase` |
| Data scope | `storeId` + collections plates | `boutiques/{id}/` | collections plates |
| Services | couche `src/services/` | `firebase/services/` | inline pages |
| Realtime | notifications only | `useCollection` partout | `useCollection` |
| i18n | next-intl fr/en/pt | N/A | N/A |
| Devise ref | FCFA | GNF | EUR+GNF |
