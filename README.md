# FODOBA IMPEX

Application web de gestion commerciale **multi-boutiques** (gros et détail) — ventes, stocks, caisse, achats, clients et rapports.

**Stack** : Next.js 15 · React 19 · TypeScript · Firebase (Auth + Firestore) · shadcn/ui · Tailwind

## Démarrage rapide

```bash
git clone https://github.com/adamsbarry18/fodoba-impex.next.git
cd fodoba-impex.next
npm install
cp .env.example .env.local   # renseigner les clés Firebase
npm run dev                  # http://localhost:9002
```

**Premier compte** : au premier login Firebase, si la collection `users` est vide, le profil est créé automatiquement en **admin** (`AuthContext`).

## Scripts

| Commande | Description |
|----------|-------------|
| `npm run dev` | Dev server (port **9002**) |
| `npm run typecheck` | Vérification TypeScript (**obligatoire** avant PR) |
| `npm run lint` | ESLint |
| `npm run build` | Build production |

## Configuration

### Variables d'environnement

Copier [`.env.example`](.env.example) vers `.env.local` et remplir les clés `NEXT_PUBLIC_FIREBASE_*` depuis la console Firebase.

### Règles Firestore

Le fichier [`firestore.rules`](firestore.rules) à la racine définit le RBAC côté base. **À publier** dans Firebase Console → Firestore → Règles (remplacement complet de la règle temporaire `/{document=**}`).

Points clés des règles :

- Accès scoping par `storeId` + `boutiqueIds` du profil utilisateur
- Auto-édition profil : `prenom`, `nom`, `phone`, `photoURL` uniquement
- Admin : gestion complète des `users`, `stores`, `currencies`, etc.

### Rôles

| Rôle | Code Firestore | Périmètre |
|------|----------------|-----------|
| Administrateur | `admin` | Réseau complet, paramètres système |
| Gérant | `manager` | Boutiques assignées, catalogue, achats |
| Vendeur | `seller` | POS, caisse, stock (boutiques autorisées) |

Permissions détaillées : [`src/lib/auth/permissions.ts`](src/lib/auth/permissions.ts).

## Architecture

```
src/
├── app/
│   ├── login/                 # Auth
│   └── (dashboard)/           # App authentifiée (sidebar + header)
├── components/                # UI, layout, pos, auth…
├── services/*.service.ts      # Couche métier Firestore (obligatoire)
├── lib/
│   ├── contexts/              # Auth, Store, Currency, Notifications
│   ├── navigation/app-nav.ts  # Menu sidebar
│   ├── types.ts               # Types + schémas Zod
│   └── *-utils.ts             # Helpers métier par domaine
└── hooks/                     # permissions, currency, barcode…
```

**Providers** (`src/app/layout.tsx`) :  
`AuthProvider` → `CurrencyProvider` → `StoreProvider` → `NotificationProvider` → `AuthLayoutWrapper`

**Conventions** :

- Collections Firestore **plates** + champ `storeId` (pas de sous-collections par boutique)
- Stock : document ID `{storeId}_{productId}`
- Devise comptable de référence : **FCFA**
- UI et toasts en **français** ; notifications via Firestore (`notifications`)
- Requêtes Firestore : filtrer par `storeId` quand les règles l'exigent (ex. `cash_movements`)

## Modules principaux

| Route | Module |
|-------|--------|
| `/dashboard` | Tableau de bord |
| `/pos` | Point de vente |
| `/inventory` | Catalogue & stocks |
| `/inventory/history` | Historique des flux |
| `/purchases` | Achats fournisseurs |
| `/clients`, `/suppliers` | Tiers |
| `/expenses` | Dépenses |
| `/reconciliation` | Caisse & trésorerie |
| `/landed-cost` | Coût de revient |
| `/reports` | Rapports & BI |
| `/admin/*` | Boutiques, users, catégories, devises, audit |
| `/profile` | Profil utilisateur |

## Déploiement

### Vercel (recommandé)

1. Lier le dépôt GitHub à Vercel
2. Ajouter les variables `NEXT_PUBLIC_FIREBASE_*` (Settings → Environment Variables)
3. Publier `firestore.rules` dans Firebase Console

### CI/CD GitHub

- Push/PR sur `main` ou `dev` → **validate** (lint + typecheck + build)
- Déploiement production → déclenchement manuel `workflow_dispatch` (`.github/workflows/ci-cd.yml`)

## Documentation

| Ressource | Contenu |
|-----------|---------|
| [`docs/cahier_de_charges.md`](docs/cahier_de_charges.md) | CDC v1.0 — règles métier |
| [`docs/blueprint.md`](docs/blueprint.md) | Spec produit |
| [`.cursor/skills/fodoba/`](.cursor/skills/fodoba/) | Conventions code pour Cursor / agents IA |
| [`.cursor/rules/`](.cursor/rules/) | Règles persistantes documentation & code |

> **Note** : le mode hors-ligne (IndexedDB) est mentionné dans le CDC mais **non implémenté** dans le code actuel.

## Sécurité

- Firebase Authentication (email/mot de passe)
- RBAC applicatif (`usePermissions`) + règles Firestore
- Journal d'audit (`audit_logs`)
- Création collaborateurs via app Firebase secondaire (`UserService.createCollaborator`)

## Licence

Propriétaire — FODOBA IMPEX
