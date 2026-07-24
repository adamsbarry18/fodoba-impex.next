# FODOBA BUSINESS

Application web de gestion commerciale **multi-boutiques** (gros et détail) - ventes, stocks, caisse, achats, clients et rapports.

**Domaine** : [fodoba-business.com](https://fodoba-business.com)

**Stack** : Next.js 15 · React 19 · TypeScript · Firebase (Auth + Firestore) · next-intl · shadcn/ui · Tailwind

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

### Migration champs utilisateur (FR → EN)

Les profils `users` utilisent `firstName`, `lastName`, `active`, `storeIds`. Si des documents existent encore avec `prenom` / `nom` / `actif` / `boutiqueIds` :

```bash
# Dry-run
DRY_RUN=1 GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json npm run migrate:user-fields

# Écriture
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json npm run migrate:user-fields
```

Ensuite déployer le code et republier `firestore.rules`.

Points clés des règles :

- Accès scoping par `storeId` + `boutiqueIds` du profil utilisateur
- Auto-édition profil : `prenom`, `nom`, `phone`, `photoURL` uniquement
- Admin : gestion complète des `users`, `stores`, `currencies`, etc.

### Images produits (Vercel Blob)

Les images sont stockées sur **Vercel Blob** (store `fodoba-impex-blob`, région CDG1). L’URL est enregistrée dans Firestore (`imageUrl`).

**Store Private (défaut)** : le fichier est privé sur Blob ; l’app sert l’image via `/api/uploads/product-image/view?pathname=…`.

**Store Public** : définir `BLOB_ACCESS=public` pour enregistrer l’URL Blob directe dans Firestore.

**Setup local :**

```bash
vercel link
vercel env pull .env.local
```

Variable requise : `BLOB_READ_WRITE_TOKEN` (ajoutée automatiquement à la connexion du store).

**Flux :**

1. Fichier choisi dans le formulaire (optionnel).
2. Création du produit dans Firestore.
3. `POST /api/uploads/product-image` → `@vercel/blob` `put()` → `products/{productId}/{timestamp}.jpg`
4. URL sauvée dans **`imageUrl`** (proxy app si store Private, URL Blob directe si Public).

Sans `BLOB_READ_WRITE_TOKEN` (dev hors Vercel), repli sur `public/uploads/` en local.

Limites upload serveur : **4,5 Mo**, types `image/*`.

### Rôles

| Rôle | Code Firestore | Périmètre |
|------|----------------|-----------|
| Administrateur | `admin` | Réseau complet, paramètres système |
| Gérant | `manager` | Boutiques assignées, catalogue, achats |
| Vendeur | `seller` | POS, caisse, stock (boutiques autorisées) |

Permissions détaillées : [`src/lib/auth/permissions.ts`](src/lib/auth/permissions.ts).

## Internationalisation

L'interface est traduite en **français**, **anglais** et **portugais**.

| Élément | Emplacement |
|---------|-------------|
| Langues | `fr` (défaut), `en`, `pt` - [`src/i18n/config.ts`](src/i18n/config.ts) |
| Messages | [`src/i18n/messages/`](src/i18n/messages/) - clés plates `"module.key"` |
| Provider | [`src/i18n/context.tsx`](src/i18n/context.tsx) - `I18nProvider` dans `layout.tsx` |
| Sélecteur langue | Header (`app-header.tsx`) - persistance `localStorage` (`fodoba-locale`) |

**Usage dans les composants client :**

```tsx
import { useT, useLocale } from "@/i18n/context"

const t = useT()
const { locale, setLocale } = useLocale()

return <h1>{t("purchases.title")}</h1>
```

**Conventions :**

- Jamais de texte UI en dur - ajouter la clé dans **fr.json, en.json et pt.json**
- Constantes avec clés (`payment-methods.ts`, `badge-tones.ts`) → `t(key)` à l'affichage
- Variables : `t("key", { store: name })` ; rich text : `t.rich(...)`
- PDF / hors React : `getAppName()`, `getPaymentMethodLabelFr()` - [`src/lib/constants/`](src/lib/constants/)

## Architecture

```
src/
├── app/
│   ├── login/                 # Auth
│   └── (dashboard)/           # App authentifiée (sidebar + header)
├── i18n/                      # config, messages, provider, nestMessages
├── components/                # UI, layout, pos, auth…
├── services/*.service.ts      # Couche métier Firestore (obligatoire)
├── lib/
│   ├── contexts/              # Auth, Store, Currency, Notifications
│   ├── navigation/app-nav.ts  # Menu sidebar (clés nav.*)
│   ├── constants/             # payment-methods, branding…
│   ├── types.ts               # Types + schémas Zod
│   └── *-utils.ts             # Helpers métier par domaine
└── hooks/                     # permissions, currency, i18n, barcode…
```

**Providers** (`src/app/layout.tsx`) :  
`I18nProvider` → `AuthProvider` → `CurrencyProvider` → `StoreProvider` → `NotificationProvider` → `AuthLayoutWrapper`

**Conventions** :

- Collections Firestore **plates** + champ `storeId` (pas de sous-collections par boutique)
- Stock : document ID `{storeId}_{productId}`
- Devise comptable de référence : **FCFA**
- Notifications via Firestore (`notifications`)
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
| [`docs/cahier_de_charges.md`](docs/cahier_de_charges.md) | CDC v1.0 - règles métier |
| [`docs/blueprint.md`](docs/blueprint.md) | Spec produit |
| [`.agents/skills/fodoba/`](.agents/skills/fodoba/) | Skill agent IA - conventions code (`SKILL.md` + `reference.md`) |
| [`.agents/rules/`](.agents/rules/) | Règles persistantes documentation & code |

Le dossier [`.agents/`](.agents/) regroupe skills et rules pour les assistants IA (Cursor, Copilot, etc.) - indépendant de l'IDE.

> **Note** : le mode hors-ligne (IndexedDB) est mentionné dans le CDC mais **non implémenté** dans le code actuel.

## Sécurité

- Firebase Authentication (email/mot de passe)
- RBAC applicatif (`usePermissions`) + règles Firestore
- Journal d'audit (`audit_logs`)
- Création collaborateurs via app Firebase secondaire (`UserService.createCollaborator`)

## Licence

Propriétaire - FODOBA BUSINESS
