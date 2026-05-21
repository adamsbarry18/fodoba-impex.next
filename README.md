# FODOBA IMPEX

Logiciel de gestion commerciale multi-boutiques pour le commerce de gros et détail de produits alimentaires.

## 📋 Description

FODOBA IMPEX est une application web moderne de gestion commerciale permettant de gérer plusieurs points de vente avec une interface unifiée. Elle supporte les transactions multi-devises (GNF, FCFA, USD, EUR) et accepte cinq modes de paiement différents.

### Fonctionnalités principales

- **Gestion multi-boutiques** : Création illimitée de boutiques avec stocks et caisses indépendants
- **Catalogue produits global** : Gestion centralisée des produits avec codes-barres/QR codes
- **Gestion des stocks** : Suivi en temps réel, alertes de rupture, transferts inter-boutiques
- **Ventes multi-devises** : Paiement comptant, partiel ou crédit avec remises
- **Caisse et trésorerie** : 5 modes de paiement, clôture quotidienne, rapports
- **Achats et fournisseurs** : Commandes, réception, calcul coût de revient multi-devises
- **Gestion des clients** : Base globale, crédit/dettes, remboursements
- **Dépenses** : Suivi des charges opérationnelles par boutique
- **Rapports et dashboard** : Tableaux de bord consolidés, exports Excel/PDF

### Rôles utilisateurs

| Rôle | Responsabilités |
|------|-----------------|
| **Admin** | Gestion globale, création boutiques, taux de change, supervision |
| **Gérant** | Gestion achats, transferts, dépenses, rapports de ses boutiques |
| **Vendeur/Caissier** | Ventes, encaissements, remboursements |

## 🛠 Stack Technique

| Composant | Technologie |
|-----------|-------------|
| **Frontend** | Next.js 15.5.9, React 19.2.1, TypeScript |
| **Styling** | Tailwind CSS, Radix UI, Lucide Icons |
| **Base de données** | Firebase Firestore |
| **Authentification** | Firebase Authentication |
| **Offline** | IndexedDB |
| **Formulaires** | React Hook Form, Zod |
| **Graphiques** | Recharts |
| **PDF** | jsPDF, jsPDF-autotable |
| **QR Codes** | qrcode, qrcode.react |
| **CSV/Excel** | PapaParse |

## 📦 Installation

### Prérequis

- Node.js 20+
- npm ou yarn
- Compte Firebase

### Étapes d'installation

1. **Cloner le repository**
   ```bash
   git clone https://github.com/adamsbarry18/fodoba-impex.next.git
   cd fodoba-impex.next
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer Firebase**
   
   Créer un fichier `.env.local` à la racine du projet :
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **Lancer le serveur de développement**
   ```bash
   npm run dev
   ```
   
   L'application sera accessible sur `http://localhost:9002`

## 🚀 Scripts disponibles

| Script | Description |
|--------|-------------|
| `npm run dev` | Lance le serveur de développement (port 9002) |
| `npm run build` | Build pour production |
| `npm start` | Lance le serveur de production |
| `npm run lint` | Exécute ESLint |
| `npm run typecheck` | Vérifie les types TypeScript |

## 🌐 Déploiement

L'application est conçue pour être déployée sur **Vercel** :

```bash
npm install -g vercel
vercel
```

## 📱 Caractéristiques

- **Interface responsive** : Compatible desktop, tablette et mobile
- **Multi-langue** : Français (prévu portugais et anglais)
- **Offline** : Support partiel hors ligne avec IndexedDB
- **Sécurité** : Authentification, RBAC, HTTPS, journal d'audit
- **Performance** : Temps de chargement < 3 secondes

## 📄 Modules détaillés

### Gestion des stocks
- Catalogue produits avec codes-barres/QR codes
- Stock indépendant par boutique
- Mouvements : entrées, sorties, transferts, corrections
- Alertes de rupture de stock
- Inventaires physiques

### Gestion des ventes
- Processus de vente en 8 étapes
- 5 modes de paiement : Espèces, Orange Money, Mobile Money, Carte bancaire, Virement
- Paiement comptant, partiel ou crédit
- Remises par article ou globale
- Retours et avoirs

### Gestion de la caisse
- Ouverture/Clôture quotidienne
- Solde temps réel
- Rapprochement par mode de paiement
- Rapport journalier

### Gestion des achats
- Base fournisseurs (local/import)
- Commandes multi-devises
- Calcul coût de revient avec frais annexes
- Suivi des encours fournisseurs

### Rapports
- Dashboard Gérant : CA du jour, solde caisse, créances, alertes
- Dashboard Admin : Vue consolidée multi-boutiques
- Exports Excel/PDF pour tous les rapports

## 🔒 Sécurité

- Authentification obligatoire avec Firebase Auth
- Gestion des rôles et permissions (RBAC)
- Sessions avec expiration automatique
- Journal d'audit des actions sensibles
- Données chiffrées en transit et au repos

## 📞 Support

Pour toute question ou problème, contacter l'équipe de développement.

## 📝 Licence

Propriétaire - FODOBA IMPEX

---

**Version** : 1.0  
**Date** : Mai 2026  
