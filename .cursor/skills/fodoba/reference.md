# Fodoba — Référence complète

## Structure `src/`

| Dossier | Rôle |
|---------|------|
| `src/app/` | Routes (`login`, `(dashboard)/*`) |
| `src/services/` | Couche métier Firestore (16 services) |
| `src/lib/contexts/` | Auth, Store, Currency, Notifications |
| `src/lib/types.ts` | Types + schémas Zod |
| `src/lib/auth/permissions.ts` | Matrice RBAC |
| `src/lib/firebase/` | Config + client (`client.ts`) |
| `src/components/` | Layout, auth, notifications, `ui/` shadcn |
| `src/hooks/` | permissions, currency, mobile |

## Providers (ordre fixe)

`AuthProvider` → `CurrencyProvider` → `StoreProvider` → `NotificationProvider` → `AuthLayoutWrapper`

Fichier : `src/app/layout.tsx`

## Conventions

- Routes : anglais kebab-case (`/inventory/transfers/new`, `/landed-cost`)
- Rôles Firestore : `"admin"`, `"manager"`, `"seller"` (lowercase)
- Permissions : `"action:ressource"` — `permissions.ts`
- Services : `{Domain}Service` dans `{domain}.service.ts`
- Champs mixtes : `nom`/`prenom`/`boutiqueIds` (profil) vs `storeId`/`activeStore` (contexte)
- localStorage boutique : clé `activeStoreId`
- Devise référence comptable : **FCFA** ; aussi GNF, USD, EUR

## Firebase

### Import

```tsx
import { app, auth, db } from '@/lib/firebase/client';
```

Config : `NEXT_PUBLIC_FIREBASE_*` — `.env.example`

### Pattern données

- Collections **plates** (pas de sous-collections par boutique)
- Scoping : champ `storeId` + `useStore().activeStore`
- Stock composite : doc ID `{storeId}_{productId}`
- Chargement : `useEffect` + appels `XxxService`, pas de hooks `useCollection`

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
| `notifications` | `notification.service.ts` | Alertes (**Firestore**) |
| `audit_logs` | `user.service.ts` | Journal audit |

### Services (`src/services/`)

`auth`, `user`, `store`, `category`, `product`, `inventory`, `client`, `supplier`, `purchase`, `sale`, `cash`, `expense`, `currency`, `notification`, `report`, `print`

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

- Erreurs FR : `AuthService.handleAuthError()` — `auth.service.ts`
- Bootstrap : premier user → admin auto si `users` vide — `AuthContext.tsx`
- Création collaborateur : app Firebase secondaire — `UserService.createCollaborator`

### Index Firestore

Éviter `where` + `orderBy` composites — tri/filtre en mémoire (commentaires dans `product.service.ts`, `notification.service.ts`).

## Contextes & hooks

| Hook | Usage |
|------|-------|
| `useAuth()` | user, rôle, login/logout |
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

Garde UI : `RoleGuard` — `src/components/auth/role-guard.tsx`
Nav sidebar filtrée par `usePermissions()` — `app-sidebar.tsx`

## UI

### Layout dashboard

Route group `(dashboard)/layout.tsx` :
`SidebarProvider` → `AppSidebar` + `AppHeader` + carte scrollable `max-w-[1600px]`

Pas de wrapper `<AppLayout>` — layout intégré au route group.
Auth guard : `auth-layout-wrapper.tsx` (redirect `/login`).

### Style

- `lang="fr"`, accent vert `#1DD97C`
- Fonts : Inter (body), Space Grotesk (headline)
- Titres : `text-2xl sm:text-3xl font-bold font-headline`

### Toasts

```tsx
import { toast } from "sonner";
toast.success("Vente enregistrée");
toast.error("Erreur lors de l'enregistrement");
```

### Formulaires

**CRUD** (fournisseurs, clients, admin…) :

```tsx
const form = useForm<z.infer<typeof Schema>>({
  resolver: zodResolver(Schema),
});
```

**Flux transactionnels** (POS, achats) : `useState` manuel.

### Listes

`useState` + pagination `lastVisible`/`hasMore` via services (`ProductService.listProducts()`).

## Domaines métier

### POS / Ventes

- Page : `src/app/(dashboard)/pos/page.tsx`
- Service : `SaleService.processSale()`
- Prérequis : session caisse ouverte (`CashService.getActiveSession`)
- Transaction : décrémente stock, crée vente, mouvements, paiements client si crédit

### Achats / Import

- `purchases/new/page.tsx`, `purchase.service.ts`
- Coût de revient : `src/lib/calculations.ts`, page `landed-cost`

### Stock / Inventaire

- Transferts inter-boutiques : `inventory/transfers/new`
- Ajustements : `inventory.service.ts`
- Historique : `inventory/history`

### Caisse

- `cash.service.ts` — sessions ouvertes/fermées, rapprochement
- Page : `reconciliation/page.tsx`

### Rapports

- `report.service.ts` + pages `reports/*` (sales, cash, clients, suppliers, finance, inventory)
- PDF : `print.service.ts`

### Notifications

Firestore collection `notifications` — `NotificationService.createNotification()`
Contexte : `NotificationContext` avec `onSnapshot`
Panel : `notification-panel.tsx`

## Routes principales

| Route | Module |
|-------|--------|
| `/dashboard` | Tableau de bord |
| `/pos` | Point de vente |
| `/inventory` | Stock |
| `/purchases` | Achats fournisseurs |
| `/clients`, `/suppliers` | Tiers |
| `/expenses` | Dépenses |
| `/reconciliation` | Caisse |
| `/landed-cost` | Coût de revient |
| `/reports/*` | Rapports |
| `/admin/*` | Boutiques, users, catégories, devises, audit |

## CI/CD

- Push/PR `main`/`dev` → job `validate` (lint + typecheck + build)
- Déploiement Vercel : `workflow_dispatch` uniquement — `.github/workflows/ci-cd.yml`

## Documentation projet

| Fichier | Rôle |
|---------|------|
| `README.md` | Setup, stack, modules |
| `docs/cahier_de_charges.md` | CDC v1.0 — **source métier** |
| `docs/blueprint.md` | Spec produit (partiellement EN/aspirational) |

Le **code fait foi** techniquement ; le **CDC** pour les règles métier.
README offline/IndexedDB : aspirational, non implémenté dans `src/`.

## Différences vs Hoolo / Cashflow

| | Fodoba | Hoolo | Cashflow |
|---|--------|-------|----------|
| Import Firebase | `@/lib/firebase/client` | `@/firebase` | `@/firebase` |
| Data scope | `storeId` + collections plates | `boutiques/{id}/` | collections plates |
| Services | 16 services obligatoires | `firebase/services/` | inline pages |
| Realtime | notifs only | `useCollection` partout | `useCollection`/`useDoc` |
| Notifications | Firestore | localStorage | N/A |
| Devise ref | FCFA | GNF | EUR+GNF |
| Formulaires | RHF+zod (CRUD) | useState | useState |
| Toasts | sonner | sonner + Radix | Radix |
