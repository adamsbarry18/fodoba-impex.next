# CAHIER DES CHARGES  
## Logiciel de Gestion Commerciale Multi-Boutiques

### FODOBA BUSINESS  
**Commerce de gros et détail - Produits alimentaires**  

**Version 1.0 -Mai 2026**

---

| Élément | Détail |
|---|---|
| **Projet** | Logiciel de gestion commerciale multi-boutiques |
| **Client** | FODOBA BUSINESS -Gros et détail alimentaire |
| **Secteur** | Distribution et commerce de produits alimentaires |
| **Devises** | GNF, FCFA (référence), USD, EUR |
| **Version** | v1.0 -Document définitif corrigé |
| **Date** | Mai 2026 |
| **Statut** | Validé |

---

# Sommaire

1. [Présentation du projet](#1-présentation-du-projet)  
2. [Gestion des utilisateurs et droits](#2-gestion-des-utilisateurs-et-droits)  
3. [Gestion des boutiques](#3-gestion-des-boutiques)  
4. [Gestion des devises et taux de change](#4-gestion-des-devises-et-taux-de-change)  
5. [Catalogue produits](#5-catalogue-produits)  
6. [Gestion des stocks](#6-gestion-des-stocks)  
7. [Gestion des ventes](#7-gestion-des-ventes)  
8. [Gestion des achats et fournisseurs](#8-gestion-des-achats-et-fournisseurs)  
9. [Gestion des dépenses](#9-gestion-des-dépenses)  
10. [Gestion de la caisse et trésorerie](#10-gestion-de-la-caisse-et-trésorerie)  
11. [Gestion des clients](#11-gestion-des-clients)  
12. [Rapports et tableau de bord](#12-rapports-et-tableau-de-bord)  
13. [Exigences techniques](#13-exigences-techniques)  

---

# 1. Présentation du Projet

## 1.1 Contexte

FODOBA BUSINESS est une entreprise de distribution alimentaire (gros et détail) opérant sur plusieurs points de vente. Elle approvisionne une clientèle variée : particuliers, revendeurs et grossistes en produits alimentaires.

La gestion actuelle est manuelle ou basée sur des tableurs, ce qui rend difficile le suivi fiable des ventes, stocks, achats, dépenses et trésorerie sur l’ensemble des boutiques.

L’entreprise travaille avec plusieurs devises (GNF, FCFA, USD, EUR) et accepte cinq modes de paiement différents.

L’objectif est de doter l’entreprise d’un logiciel web moderne, simple et rapide.

---

## 1.2 Périmètre fonctionnel

| Priorité | Module | Description | Statut |
|---|---|---|---|
| P1 | Stock | Catalogue, niveaux de stock, mouvements, alertes rupture | Indispensable |
| P1 | Ventes | Comptant, paiement partiel, crédit, remises, multi-devises | Indispensable |
| P1 | Caisse | 5 modes de paiement, solde temps réel, clôture quotidienne | Indispensable |
| P2 | Achats | Commandes fournisseurs, réception, coût de revient multi-devises | Indispensable |
| P2 | Dépenses | Charges opérationnelles par boutique | Indispensable |
| P2 | Clients | Base globale, historique, crédit/dettes, remboursements | Indispensable |
| P3 | Rapports | Dashboard, statistiques ventes/stock/trésorerie | Important |

---

## 1.3 Hors périmètre

- Comptabilité générale et bilan certifié  
- Gestion de la paie et des ressources humaines  
- Vente en ligne / e-commerce  
- Gestion de production ou transformation de produits  
- Intégration avec des logiciels bancaires ou ERP tiers  

---

# 2. Gestion des Utilisateurs et Droits

## 2.1 Les trois rôles

| Rôle | Responsabilités | Périmètre |
|---|---|---|
| Admin | Création boutiques, gestion comptes, supervision globale, taux de change | Toutes boutiques |
| Gérant | Gestion achats, transferts, dépenses, rapports | Ses boutiques |
| Vendeur / Caissier | Ventes, encaissements, remboursements clients | Sa boutique |

---

## 2.2 Matrice des permissions

| Action | Admin | Gérant | Vendeur |
|---|---|---|---|
| Créer / supprimer une boutique | Oui | Non | Non |
| Créer et gérer les utilisateurs | Oui | Oui (sa boutique) | Non |
| Gérer le catalogue produits | Oui | Oui | Non |
| Consulter le stock | Oui | Oui | Oui |
| Ajuster le stock | Oui | Oui | Non |
| Initier un transfert | Oui | Oui | Non |
| Enregistrer une vente | Oui | Oui | Oui |
| Appliquer une remise | Illimitée | Selon seuil | Selon seuil |
| Annuler / modifier une vente | Oui | Oui | Oui |
| Enregistrer un achat fournisseur | Oui | Oui | Non |
| Valider une réception | Oui | Oui | Non |
| Enregistrer une dépense | Oui | Oui | Oui |
| Ouvrir / clôturer la caisse | Oui | Oui | Oui |
| Mettre à jour les taux de change | Oui | Non | Non |
| Voir rapports toutes boutiques | Oui | Non | Non |

---

## 2.3 Sécurité

- Authentification obligatoire  
- Mot de passe chiffré  
- Expiration automatique des sessions  
- Suspension de compte sans perte d’historique  
- Journal d’audit complet des actions sensibles  

---

# 3. Gestion des Boutiques

## 3.1 Création et configuration

- Création illimitée de boutiques par l’Admin  
- Informations : nom, adresse, téléphone, code unique  
- Stock et caisse indépendants par boutique  
- Clients et fournisseurs partagés globalement  
- Suspension possible sans suppression des données  

---

## 3.2 Transferts de stock

Le gérant peut effectuer des transferts entre boutiques sans validation de l’Admin.

Chaque transfert génère automatiquement :
- Un numéro unique  
- Une date  
- Les articles transférés  
- Les quantités  
- Le responsable du transfert  

Historique consultable par l’Admin.

---

## 3.3 Vue Admin

- Tableau de bord global  
- Vue consolidée multi-boutiques  
- Filtrage par boutique  

---

# 4. Gestion des Devises et Taux de Change

FODOBA BUSINESS fonctionne en multi-devises avec le FCFA comme devise de référence.

## 4.1 Devises supportées

| Devise | Code | Usage principal |
|---|---|---|
| Franc Guinéen | GNF | Transactions locales Guinée |
| Franc CFA | FCFA | Devise de référence |
| Dollar Américain | USD | Importations |
| Euro | EUR | Fournisseurs européens |

---

## 4.2 Gestion des taux de change

- Mise à jour par l’Admin uniquement  
- Historique horodaté des taux  
- Conversion automatique en FCFA  
- Affichage des montants convertis en temps réel  
- Rapports consolidés en FCFA  

---

# 5. Catalogue Produits

Le catalogue produits est global pour toute l’entreprise.

## 5.1 Fiche produit

| Champ | Description |
|---|---|
| Référence | Code unique / QR Code / Code-barres |
| Désignation | Nom du produit |
| Catégorie | Classification paramétrable |
| Unité de vente | Kg, litre, pièce, carton, etc. |
| Conditionnement | Exemple : 1 carton = 12 bouteilles |
| Prix d’achat moyen | Calcul automatique |
| Prix de vente FCFA | Prix public |
| Prix en devise | USD / EUR / GNF |
| Seuil d’alerte | Quantité minimale |
| Statut | Actif / Inactif |

---

## 5.2 Gestion du catalogue

- Recherche rapide  
- Filtres avancés  
- Import / Export Excel & CSV  
- Gestion par Admin ou Gérant  

---

# 6. Gestion des Stocks

## 6.1 Principe général

- Stock indépendant par boutique  
- Mise à jour en temps réel  
- Interdiction de stock négatif  
- Historique complet des mouvements  

---

## 6.2 Types de mouvements

| Mouvement | Type | Impact |
|---|---|---|
| Réception achat | Entrée | + Stock |
| Vente | Sortie | - Stock |
| Transfert entrant | Entrée | + Stock |
| Transfert sortant | Sortie | - Stock |
| Retour client | Entrée | + Stock |
| Correction inventaire | Ajustement | +/- |

---

## 6.3 Alertes et inventaires

- Alertes rupture  
- Inventaire physique  
- Ajustements validés  
- Export Excel / PDF  

---

# 7. Gestion des Ventes

## 7.1 Processus de vente

1. Ouverture de la vente  
2. Ajout des articles  
3. Application des remises  
4. Sélection du client  
5. Choix de la devise  
6. Mode de règlement  
7. Validation  
8. Impression du reçu  

---

## 7.2 Modes de paiement

| Mode | Description |
|---|---|
| Espèces | Paiement cash |
| Orange Money | Paiement mobile Orange |
| Mobile Money | Wave, MTN Money, etc. |
| Carte bancaire | Paiement TPE |
| Virement bancaire | Virement reçu |
| Crédit | Dette client |
| Mixte | Combinaison de plusieurs modes |

---

## 7.3 Gestion des remises

- Remise par article  
- Remise globale  
- Pourcentage ou montant fixe  
- Gestion par seuils d’autorisation  

---

## 7.4 Modes de règlement

### A. Paiement comptant
- Paiement intégral immédiat  
- Mise à jour instantanée de la caisse  

### B. Paiement partiel
- Acompte + dette automatique  
- Encours client mis à jour  

### C. Vente à crédit
- Dette intégrale  
- Contrôle du plafond client  

---

## 7.5 Remboursements clients

- Paiement partiel ou total  
- Multi-modes de paiement  
- Reçu imprimable  

---

## 7.6 Retours et avoirs

- Retour lié à une vente  
- Remboursement ou avoir  
- Réintégration du stock  

---

# 8. Gestion des Achats et Fournisseurs

## 8.1 Base fournisseurs

| Champ | Description |
|---|---|
| Nom | Fournisseur |
| Pays / Ville | Localisation |
| Type | Local / Import |
| Devise | GNF / FCFA / USD / EUR |
| Conditions | Comptant / 15j / 30j |
| Encours | Factures impayées |
| Historique | Achats et paiements |

---

## 8.2 Processus d’achat

1. Création commande  
2. Choix devise  
3. Ajout frais annexes  
4. Calcul coût de revient  
5. Réception  
6. Validation  
7. Paiement fournisseur  

---

## 8.3 Exemple de coût de revient

| Élément | Montant | FCFA |
|---|---|---|
| Achat fournisseur | 500 USD | 282 095 FCFA |
| Transport | 80 USD | 45 135 FCFA |
| Douane | 120 USD | 67 702 FCFA |
| Manutention | 50 000 GNF | 3 207 FCFA |
| **Total** | 700 USD + 50 000 GNF | 398 140 FCFA |

---

## 8.4 Suivi fournisseurs

- Encours fournisseurs  
- Paiements partiels ou totaux  
- Alertes échéances  
- Export journal des achats  

---

# 9. Gestion des Dépenses

## 9.1 Catégories

| Catégorie | Exemples |
|---|---|
| Charges fixes | Loyer, assurance |
| Charges variables | Eau, électricité |
| Transport | Livraison, carburant |
| Personnel | Salaires |
| Frais commerciaux | Publicité |
| Taxes | Impôts locaux |
| Entretien | Réparations |
| Divers | Dépenses exceptionnelles |

---

## 9.2 Saisie et suivi

- Dépenses enregistrées par le Gérant  
- Débit immédiat de la caisse  
- Historique détaillé  
- Export Excel / PDF  

---

# 10. Gestion de la Caisse et Trésorerie

## 10.1 Cycle quotidien

- Ouverture de caisse  
- Encaissements  
- Dépenses  
- Solde temps réel  
- Clôture  
- Rapport journalier  

---

## 10.2 Lignes de caisse

- Espèces  
- Orange Money  
- Mobile Money  
- Carte bancaire  
- Virement bancaire  

---

## 10.3 Rapprochement

Chaque mode de paiement est rapproché séparément :
- Comptage espèces  
- Relevés mobiles  
- Tickets TPE  
- Relevés bancaires  

---

## 10.4 Rapports

- Rapport journalier  
- Vue consolidée Admin  
- Graphiques de trésorerie  
- Analyse par mode de paiement  

---

# 11. Gestion des Clients

## 11.1 Fiche client

| Champ | Description |
|---|---|
| Nom | Client |
| Téléphone | Identifiant unique |
| Adresse | Optionnelle |
| Type | Particulier / Revendeur |
| Statut | Actif / Suspendu / VIP |
| Plafond crédit | Limite autorisée |
| Encours | Dette actuelle |
| Boutique d’origine | Boutique de création |

---

## 11.2 Gestion du crédit

- Encours temps réel  
- Alertes dépassement plafond  
- Suspension crédit  
- Historique remboursements  
- Relevé PDF imprimable  

---

# 12. Rapports et Tableau de Bord

## 12.1 Dashboard Gérant

- CA du jour  
- CA encaissé  
- Solde caisse temps réel  
- Créances clients  
- Dettes fournisseurs  
- Alertes stock  
- Dépenses du mois  

---

## 12.2 Dashboard Admin

- CA global consolidé  
- Comparatif boutiques  
- Trésorerie globale  
- Valeur stock total  
- Évolution du chiffre d’affaires  

---

## 12.3 Rapports disponibles

| Rapport | Vendeur | Gérant | Admin | Export |
|---|---|---|---|---|
| Journal ventes | Oui | Oui | Oui | Excel / PDF |
| Rapport caisse | Non | Oui | Oui | PDF |
| Créances clients | Non | Oui | Oui | Excel / PDF |
| Dettes fournisseurs | Non | Oui | Oui | Excel / PDF |
| État stock | Consultation | Oui | Oui | Excel / PDF |
| Journal achats | Non | Oui | Oui | Excel / PDF |
| Rapport dépenses | Non | Oui | Oui | Excel / PDF |
| Rapport remises | Oui | Oui | Oui | Excel / PDF |
| Top produits | Non | Oui | Oui | Excel / PDF |
| Transferts | Non | Partiel | Oui | Excel / PDF |
| Bilan consolidé | Non | Non | Oui | PDF |

---

# 13. Exigences Techniques

## 13.1 Type d’application

Application web responsive.

---

## 13.2 Stack technique recommandée

| Composant | Technologie |
|---|---|
| Frontend | Next.js + Tailwind CSS |
| Base de données | Firebase Firestore |
| Authentification | Firebase Authentication |
| Offline | IndexedDB |
| Hébergement | Vercel |

---

## 13.3 Sécurité et performance

- Authentification obligatoire  
- RBAC (gestion des rôles)  
- HTTPS / TLS  
- Journal d’audit  
- Sauvegarde cloud automatique  
- Temps de chargement < 3 secondes  

---

## 13.4 Ergonomie

- Interface en français  
- Prévoir portugais et anglais  
- Compatible tablette et mobile  
- Impression navigateur :
  - Reçus  
  - Bons de commande  
  - Rapports  
  - Bons de transfert  