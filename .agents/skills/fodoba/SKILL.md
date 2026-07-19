---
name: fodoba
description: >-
  Standards et conventions du projet FODOBA BUSINESS (Next.js 15, Firebase, retail multi-boutiques).
  Couvre services Firestore, useStore, RBAC, i18n (fr/en/pt), règles de sécurité, devises FCFA,
  sonner, RHF+zod, POS/achats/stock/caisses. À utiliser pour toute tâche sur fodoba-business.
---

# Fodoba

Skill unique du projet. Détails complets dans [reference.md](reference.md).

## Stack

Next.js 15 · React 19 · Firebase 11 client · shadcn/ui · next-intl · TypeScript (`@/*` → `src/*`) · devise ref **FCFA**

## Règles essentielles

1. **i18n** — UI traduite via `useT()` ; langues `fr`, `en`, `pt` ; clés dans `src/i18n/messages/*.json` (toujours les 3 fichiers)
2. **`useStore()`** — `activeStore` obligatoire pour ventes, stock, caisse, dépenses ; attendre `loading === false`
3. **Services** — logique Firestore dans `src/services/*.service.ts`, pas inline dans les pages
4. **Import Firebase** — `@/lib/firebase/client` → `{ app, auth, db }`
5. **Pas de hooks realtime** — pas de `useCollection` ; `useEffect` + appels service (`onSnapshot` = notifications uniquement)
6. **RBAC** — `usePermissions()` / `RoleGuard`, rôles `"admin"` | `"manager"` | `"seller"`
7. **Formulaires CRUD** — react-hook-form + zod (`@/lib/types`) ; `useState` pour POS/paiement
8. **Toasts** — `import { toast } from "sonner"` + `t()` pour les messages
9. **Notifications** — collection Firestore `notifications`
10. **Firestore rules** — requêtes avec filtre `storeId` si la règle utilise `isStoreAuthorized` ; fichier `firestore.rules` à la racine
11. **Typecheck** — `npm run typecheck` obligatoire (le build ignore les erreurs TS)

## UI / composants récurrents

- `useT()` / `useLocale()` — `@/i18n/context`
- `StatusBadge` + `src/lib/badge-tones.ts` (presets traduits automatiquement)
- `useCurrency().formatAmount()`
- `useTranslatedTableColumns()` — en-têtes de colonnes traduits
- `UserAvatar` — couleur stable par `uid` (`src/lib/user-utils.ts`)
- Navigation : `app-nav.ts`, `nav-menu-items.tsx`
- Auth pages : `AuthPageShell`, `PasswordField`, `auth-utils.ts`
- Loading : `LoadingScreen` (`src/components/ui/loading-screen.tsx`)
- Marque : `t("common.appName")` ou `getAppName()` (PDF)

## Pièges à éviter

- Texte UI ou toast en dur (français/anglais) sans clé i18n
- Clés i18n affichées telles quelles (`PAYMENT.CASH`) — oublier `t()`
- Sous-collections `boutiques/{id}/` — collections plates + `storeId`
- Stock doc ID : `{storeId}_{productId}`
- Vente sans session caisse (`CashService.getActiveSession`)
- `createCollaborator` via app Firebase secondaire uniquement
- `runTransaction` : reads avant writes, pas de query dans la transaction
- Profil utilisateur : `UserService.updateOwnProfile` (champs limités) vs `updateUserProfile` (admin)
- Commits/PR sans demande explicite

## Scripts

```bash
npm run dev        # port 9002
npm run typecheck  # obligatoire
npm run lint
npm run build
```

## Référence

[reference.md](reference.md) — collections, services, i18n, permissions, flux métier, sécurité Firestore, routes.
