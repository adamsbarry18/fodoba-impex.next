---
name: fodoba
description: >-
  Standards et conventions du projet FODOBA IMPEX (Next.js 15, Firebase, retail multi-boutiques).
  Couvre services Firestore, useStore, RBAC permissions, devises FCFA, sonner, RHF+zod,
  POS/achats/stock. À utiliser pour toute tâche sur fodoba-impex.next.
---

# Fodoba

Skill unique du projet. Détails complets dans [reference.md](reference.md).

## Stack

Next.js 15 · React 19 · Firebase 11 client · shadcn/ui · TypeScript (`@/*` → `src/*`) · devise ref **FCFA**

## Règles essentielles

1. **UI en français** — réponses utilisateur en français
2. **`useStore()`** — `activeStore` obligatoire pour ventes, stock, caisse, dépenses ; attendre `loading === false`
3. **Services** — logique Firestore dans `src/services/*.service.ts`, pas inline dans les pages
4. **Import Firebase** — `@/lib/firebase/client` → `{ app, auth, db }` (pas `@/firebase` style Hoolo)
5. **Pas de hooks realtime** — pas de `useCollection`/`useMemoFirebase` ; `useEffect` + appels service
6. **RBAC** — `usePermissions()` / `RoleGuard`, rôles `"admin"` | `"manager"` | `"seller"`
7. **Formulaires CRUD** — react-hook-form + zod (`@/lib/types`) ; `useState` pour POS/achats
8. **Toasts** — `import { toast } from "sonner"` (pas `useToast` Radix en pratique)
9. **Notifications** — collection Firestore `notifications` (pas localStorage)
10. **Typecheck** — `npm run typecheck` + `lint` obligatoires (build ignore les erreurs TS)

## Pièges à éviter

- Copier patterns Hoolo/Cashflow (`useBoutiqueScope`, `useMemoFirebase`, notifs localStorage)
- Sous-collections `boutiques/{id}/` — ici collections plates + champ `storeId`
- Stock doc ID : `{storeId}_{productId}`, pas l'ID produit seul
- Vente sans session caisse ouverte (`CashService.getActiveSession`)
- `createUserWithEmailAndPassword` sur app principale — app secondaire (`UserService.createCollaborator`)
- `runTransaction` : toutes les reads avant writes, pas de query dans la transaction
- Rôles `"Admin"`/`"Vendeur"` — utiliser `"admin"`/`"manager"`/`"seller"`
- Commits/PR sans demande explicite

## Scripts

```bash
npm run dev        # port 9002
npm run build
npm run typecheck  # obligatoire
npm run lint
```

## Référence

Consulter [reference.md](reference.md) pour : collections Firestore, services, permissions, flux vente/achat/stock, UI, CDC.
