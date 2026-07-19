# 📊 Fondora - Application de Gestion Financière Personnelle

## Vue d'ensemble

**Fondora** est une application web complète et moderne de gestion financière personnelle. Elle permet aux utilisateurs français de gérer intégralement leur patrimoine, budget, investissements et placements en un seul endroit, avec des calculs financiers avancés conformes à la réglementation fiscale française.

🌐 **Site en ligne** : https://fondora.vercel.app

---

## 📋 Table des matières

1. [Fonctionnalités principales](#fonctionnalités-principales)
2. [Architecture technique](#architecture-technique)
3. [Guide des pages](#guide-des-pages)
4. [Flux d'authentification](#flux-dauthentification)
5. [Composants réutilisables](#composants-réutilisables)
6. [Installation et lancement](#installation-et-lancement)
7. [Gestion des données](#gestion-des-données)

---

## ✨ Fonctionnalités principales

### 🔐 Authentification & Sécurité

**Localisation** : `src/pages/` et `src/components/auth/`

| Fonctionnalité | Description | Fichier |
|---|---|---|
| **Inscription** | Création de compte avec Supabase Auth | `src/pages/Signup.jsx` |
| **Connexion** | Authentification par email/mot de passe | `src/pages/Login.jsx` |
| **Authentification Multi-Facteurs (2FA)** | Vérification MFA TOTP | `src/pages/auth/VerifyMFA.jsx`, `src/components/auth/MFAGuard.jsx` |
| **Routes protégées** | Redirection automatique des utilisateurs non authentifiés | `src/components/ProtectedRoute.jsx` |
| **Suppression de compte** | Suppression sécurisée avec confirmation | `src/pages/SupprimerCompteConfirmer.jsx` |

---

### 💰 Gestion du Patrimoine

**Localisation** : `src/pages/Patrimoine.jsx`

#### 📊 Vue consolidée du patrimoine

- **Patrimoine brut total** : Somme de tous les actifs
- **Patrimoine net** : Patrimoine brut - Dettes totales
- **Ventilation par type d'actif** :
  - Comptes bancaires (courants, épargne, etc.)
  - Actions & ETF (en PEA/CTO)
  - Crypto-monnaies
  - Immobilier
  - Dettes (créances remboursables)

#### 📈 Graphique d'évolution

- Historique du patrimoine net dans le temps
- Composant : `src/components/NetWorthChart.jsx`
- Visualisation avec Recharts

#### 🏦 Gestion des comptes

- **Types de comptes supportés** : Compte courant, Épargne, Crédit, PEA, CTO, Assurance vie, Crypto, Immobilier, Autre
- **Paramètres par compte** :
  - Nom et type
  - Solde actuel
  - Devise (EUR, USD, GBP, CHF, etc.)
  - Couleur de catégorisation
  - Frais de gestion
  - Frais de courtage
- **CRUD complet** : Ajout, modification, suppression de comptes

#### 📍 Comparaison INSEE

- Comparaison de votre patrimoine avec les statistiques INSEE
- Composant : `src/components/ComparaisonINSEE.jsx`

---

### 📑 Budget & Suivi des dépenses

**Localisation** : `src/pages/Budget.jsx`

#### 💸 Création et gestion de budgets

- Création de budgets par catégorie (alimentation, transports, loisirs, etc.)
- Définition d'un montant limite par catégorie et période
- Support de plusieurs devises

#### 📊 Visualisation des dépenses

- **Graphiques dynamiques** :
  - Diagramme circulaire (donut chart) de la répartition
  - Graphique en barres comparatif : budgeté vs dépensé
  - Évolution temporelle des soldes

#### 📈 Suivi des performances

- Taux de dépassement par catégorie
- Indicateurs visuels (alertes si dépassement)
- Historique des dépenses

#### 💾 Import de données

- Importation de fichiers CSV/Excel
- Mappeur automatique de colonnes
- Contrôle de qualité avant enregistrement
- Composant : `src/components/ImportCSVModal.jsx`

---

### 📈 Investissements & Bourse

**Localisation** : `src/pages/Investir.jsx`, `src/components/investir/`, `src/hooks/usePositions.js`

#### 🎯 Suivi des positions de bourse

- Ajout de positions (symbole, quantité, prix d'achat)
- Récupération des cours en temps réel via API
- Calcul automatique de la valeur actuelle

#### 💹 Métriques de performance avancées

| Métrique | Description | Calcul |
|---|---|---|
| **XIRR/TRI** | Taux de rentabilité interne | Utilise la méthode Newton-Raphson |
| **CAGR** | Taux de croissance annuel composé | Croissance régulière sur N années |
| **P&L Latent** | Gain/perte non réalisé | Valeur actuelle - Coût d'acquisition |
| **P&L Réalisé** | Gain/perte réalisé à la vente | Méthode FIFO (Premier Entré, Premier Sorti) |
| **Toggle €/% | Affichage en euros ou pourcentage | `src/components/PnLLatentToggle.jsx` |

#### 📊 Score de diversification

- Analyse de la répartition du portefeuille
- Note de 0 à 100 avec lettre (A à F)
- Ventilation par :
  - Classe d'actifs (0-40 points)
  - Secteurs (0-30 points)
  - Concentration des positions (0-30 points)
- Conseils d'amélioration
- Composant : `src/components/DiversificationScore.jsx`

#### 📚 Bibliothèque financière

- **Fichier** : `src/lib/financialCalculations.js`
- **Fonctions disponibles** :
  - `calculateXIRR()` : Calcul XIRR avec Newton-Raphson
  - `calculateCAGR()` : Croissance annuelle composée
  - `calculateTRI()` : Taux de rentabilité interne français
  - `calculateFIFOPnL()` : P&L par méthode FIFO
  - `formatPercentage()`, `formatCurrency()` : Formatage français

---

### 🪙 Gestion des Crypto-monnaies

**Localisation** : `src/pages/Investir.jsx`, `src/hooks/usePositionsCrypto.js`

#### 🏆 Suivi du portefeuille

- Ajout de positions crypto (Bitcoin, Ethereum, etc.)
- Récupération des prix en temps réel (via API CoinGecko)
- Calcul de la valeur totale en euros

#### 📊 Calculs fiscaux français

- **Méthode PRU** (Prix de Revient Unitaire)
  - Conforme à l'Article 150 VH bis du CGI
  - Calcul du coût moyen pondéré de tout le portefeuille
  - Appliqué à chaque vente pour calculer le gain imposable

#### 📈 Graphique d'évolution

- Historique de la valeur du portefeuille
- Filtres temporels : 7 jours, 30 jours, 1 an, tout l'historique
- Affichage de la variation en euros et pourcentage
- Composant : `src/components/CryptoPortfolioChart.jsx`

#### 📊 Tableau des principaux cryptos

- Top cryptos par capitalisation
- Variation de prix 24h, 7j, 30j
- Composant : `src/components/TopCryptoTable.jsx`

---

### 📊 Synthèse générale

**Localisation** : `src/pages/Synthese.jsx`

- **Vue d'ensemble consolidée** :
  - Patrimoine net global
  - Répartition actifs/passifs
  - KPI clés du budget
  - Alertes et recommandations
  - Visualisations en graphiques

---

### 🏠 Immobilier

**Localisation** : `src/pages/Patrimoine.jsx`, `src/components/BienImmobilierCard.jsx`

#### 🏘️ Gestion des biens immobiliers

- Création de fiches pour chaque bien
- Paramètres :
  - Type (appartement, maison, etc.)
  - Localisation (adresse complète)
  - Valeur d'acquisition
  - Valeur estimée actuelle
  - Revenus locatifs (si applicable)
  - Hypothèque et conditions
  - Charges mensuelles/annuelles

#### 📈 Visualisation

- Carte interactice des biens
- Calcul automatique de la plus-value
- Comparaison avec les prix de marché

#### 💳 Gestion des dettes hypothécaires

- Tableau d'amortissement
- Reste à rembourser
- Taux d'intérêt appliqué

---

### 💳 Gestion des Passifs

**Localisation** : `src/pages/PassifsPage.jsx`

#### 📋 Types de dettes

- Crédits à la consommation
- Emprunts immobiliers
- Dettes de carte de crédit
- Autres emprunts

#### 💡 Paramètres par dette

- Montant emprunté
- Montant restant dû
- Taux d'intérêt annuel
- Date de début et date d'échéance
- Type de crédit

#### 📊 Analyse des dettes

- Coût total des intérêts
- Durée de remboursement restante
- Impact sur le patrimoine net
- Ratio d'endettement

---

### 🎯 Analyse personnalisée

**Localisation** : `src/pages/Analyse.jsx`

#### 📊 Tableaux de bord analytiques

- **Analyse de flux de trésorerie** :
  - Revenus vs dépenses
  - Trésorerie prévisionnelle
  - Tendances d'épargne

- **Rapport d'allocation d'actifs** :
  - Répartition par classe (actions, obligations, cash)
  - Comparaison avec un profil cible
  - Recommandations de rééquilibrage

- **Simulations et scénarios** :
  - Projection du patrimoine
  - Impact de changements d'épargne
  - Objectifs à court/moyen/long terme

---

### ⚙️ Paramètres & Préférences

**Localisation** : `src/pages/Parametres.jsx`

#### 👤 Profil utilisateur

- Informations personnelles (nom, email, photo)
- Objectifs financiers
- Profil de risque
- Horizon d'investissement

#### 🎨 Paramètres d'affichage

- Thème (clair/sombre)
- Devise de référence
- Langue
- Masquage des montants (mode incognito)

#### 🔒 Sécurité

- Gestion du mot de passe
- Activation/désactivation du 2FA
- Sessions actives
- Historique de connexion

#### 📝 Données & Conformité

- **Export de données** : Exporte toutes vos données en JSON
- **Conditions générales d'utilisation** : `cgu.md`
- **Politique de confidentialité** : `politique-confidentialite.md`
- **Mentions légales** : `mentions-legales.md`
- **Registre des traitements** : `registre-traitements.md`

---

### 📥 Export des données

**Localisation** : `src/pages/ExportDonnees.jsx`

#### 📦 Formats d'export

- **Export JSON** : Format machine-readable
- **Export CSV** : Ouverture facile dans Excel/Sheets
- **Export PDF** : Rapport formaté pour impression

#### 📋 Données exportées

- Historique complet des transactions
- Positions d'investissement
- Budgets et dépenses
- Patrimoine net
- Comptes et leurs historiques

---

### 🍪 Conformité RGPD

**Composants** : `src/components/CookieBanner.jsx`, `src/components/ReconsentementModal.jsx`

#### 🔐 Gestion du consentement

- Banneau de cookies RGPD
- Modal de renouvellement du consentement
- Respect des préférences utilisateur
- Suivi avec Vercel Analytics (consentement optionnel)

---

## 🏗️ Architecture technique

### Stack technologique

```
Langage principal      : JavaScript (89.4%)
Frontend Framework    : React 19 + Vite
UI/CSS               : Tailwind CSS v4
Charting             : Recharts (graphiques)
Backend              : Supabase (authentification, base de données)
Déploiement          : Vercel
Gestion d'état       : React Hooks + Context API
Analyse             : Vercel Analytics
```

### Dépendances principales

```json
{
  "react": "^19.2.7",
  "react-dom": "^19.2.7",
  "react-router-dom": "^7.18.1",
  "@supabase/supabase-js": "^2.110.0",
  "recharts": "^3.9.2",
  "tailwindcss": "^4.3.1",
  "lucide-react": "^1.22.0",
  "papaparse": "^5.5.4",
  "xlsx": "^0.18.5",
  "pdfjs-dist": "^6.1.200",
  "tesseract.js": "^7.0.0",
  "qrcode": "^1.5.4"
}
```

### Structure des répertoires

```
Fondora/
├── public/                    # Fichiers statiques
├── src/
│   ├── assets/               # Icônes, images
│   ├── components/           # Composants réutilisables
│   │   ├── investir/         # Composants investissement
│   │   ├── budget/           # Composants budget
│   │   ├── bourse/           # Composants bourse
│   │   ├── analyse/          # Composants analyses
│   │   ├── auth/             # Composants authentification
│   │   ├── passifs/          # Composants dettes
│   │   ├── assurance-vie/    # Composants assurance-vie
│   │   ├── mfa/              # Composants 2FA
│   │   └── onboarding/       # Composants onboarding
│   ├── config/               # Configuration (Supabase, API)
│   ├── context/              # Context API (Auth, Currency, Incognito)
│   ├── hooks/                # Custom hooks
│   │   ├── useAuth.js        # Authentification
│   │   ├── useComptes.js     # Gestion comptes
│   │   ├── usePositions.js   # Positions bourse
│   │   ├── usePositionsCrypto.js
│   │   ├── useCoursBourse.js
│   │   ├── useCoursCrypto.js
│   │   ├── useDettes.js
│   │   └── useBiensImmobiliers.js
│   ├── lib/                  # Utilitaires
│   │   ├── financialCalculations.js  # Formules financières
│   │   └── diversificationScore.js   # Calcul diversification
│   ├── pages/               # Pages principales
│   │   ├── Patrimoine.jsx
│   │   ├── Budget.jsx
│   │   ├── Investir.jsx
│   │   ├── Synthese.jsx
│   │   ├── Analyse.jsx
│   │   ├── Parametres.jsx
│   │   ├── PassifsPage.jsx
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   └── legal/
│   ├── utils/               # Fonctions utilitaires
│   ├── App.jsx              # Routage principal
│   └── main.jsx
├── supabase/                # Configuration Supabase
├── package.json
├── vite.config.js
└── vercel.json
```

---

## 🚀 Guide des pages

### Page de synthèse (`/synthese`)

**Fichier** : `src/pages/Synthese.jsx`

- **Objectif** : Aperçu global du patrimoine et santé financière
- **Affiche** :
  - Patrimoine net total
  - Répartition actifs/passifs
  - Derniers mouvements
  - Alertes urgentes

### Page Patrimoine (`/patrimoine`)

**Fichier** : `src/pages/Patrimoine.jsx`

- **Sections principales** :
  - Graphique évolution patrimoine
  - Tableau récapitulatif par classe d'actif
  - Comparaison INSEE
  - Liste des comptes
  - Modal création nouveau compte

### Page Budget (`/budget`)

**Fichier** : `src/pages/Budget.jsx`

- **Sections principales** :
  - Création/édition de budgets
  - Visualisation dépenses vs budgets
  - Graphique en camembert
  - Graphique en barres comparatif
  - Import CSV pour dépenses

### Page Investir (`/investir`)

**Fichier** : `src/pages/Investir.jsx` (42 KB)

- **Onglets** :
  - **Portefeuille Bourse** : Positions actions/ETF, XIRR, P&L
  - **Crypto** : Positions crypto, PRU, graphique historique
  - **Transactions** : Formulaires ajout/suppression transactions
  - **Diversification** : Score et analyse
  - **Historique** : Tous les mouvements

### Page Analyse (`/analyse`)

**Fichier** : `src/pages/Analyse.jsx`

- **Rapports** :
  - Analyse flux de trésorerie
  - Allocation d'actifs
  - Projections futures
  - Scénarios personnalisés

### Page Paramètres (`/parametres`)

**Fichier** : `src/pages/Parametres.jsx` (39 KB)

- **Onglets** :
  - Profil (nom, email, objectifs)
  - Sécurité (mot de passe, 2FA)
  - Préférences (thème, devise, langue)
  - Confidentialité et données
  - Export/Suppression de compte

### Page Passifs (`/passifs`)

**Fichier** : `src/pages/PassifsPage.jsx`

- **Gestion des dettes** :
  - Liste des crédits actifs
  - Tableau d'amortissement
  - Calcul des intérêts
  - Projection d'extinction

### Page Export (`/export-donnees`)

**Fichier** : `src/pages/ExportDonnees.jsx`

- **Options d'export** :
  - JSON complet
  - CSV par catégorie
  - PDF formaté

---

## 🔐 Flux d'authentification

### Authentification initiale

1. **Utilisateur non connecté** → `LandingPage` (description du service)
2. **Clic "S'inscrire"** → `Signup.jsx`
   - Création compte Supabase
   - Vérification email
3. **Clic "Se connecter"** → `Login.jsx`
   - Authentification email/password
   - Vérification 2FA (si activé)

### Vérification MFA

**Composants** : `src/pages/auth/VerifyMFA.jsx`, `src/components/auth/MFAGuard.jsx`

- Si MFA activé : affichage écran vérification TOTP
- Entrée du code à 6 chiffres
- Redirection après validation

### Routes protégées

**Composant** : `src/components/ProtectedRoute.jsx`

- Vérifie le statut authentification
- Redirection vers `/login` si non authentifié
- Bloquer accès aux routes sensitives

---

## 🧩 Composants réutilisables

### Composants génériques

| Composant | Localisation | Utilisation |
|---|---|---|
| `Layout` | `src/components/Layout.jsx` | Conteneur avec barre latérale |
| `Modal` | `src/components/Modal.jsx` | Boîte de dialogue générique |
| `StatCard` | `src/components/StatCard.jsx` | Carte de statistique |
| `SecureValue` | `src/components/SecureValue.jsx` | Affichage sécurisé montants |
| `Footer` | `src/components/Footer.jsx` | Pied de page |

### Composants de visualisation

| Composant | Type | Fichier |
|---|---|---|
| `DonutChart` | Camembert | `src/components/DonutChart.jsx` |
| `LineChartSolde` | Courbe solde | `src/components/LineChartSolde.jsx` |
| `BarChartComparatif` | Barres | `src/components/BarChartComparatif.jsx` |
| `NetWorthChart` | Évolution patrimoine | `src/components/NetWorthChart.jsx` |
| `EvolutionPatrimoineChart` | Historique | `src/components/EvolutionPatrimoineChart.jsx` |
| `SankeyChart` | Flux de trésorerie | `src/components/SankeyChart.jsx` |
| `CryptoPortfolioChart` | Crypto historique | `src/components/CryptoPortfolioChart.jsx` |

### Composants métier

| Composant | Fonction | Fichier |
|---|---|---|
| `CompteCard` | Affiche un compte | `src/components/CompteCard.jsx` |
| `BienImmobilierCard` | Affiche bien immo | `src/components/BienImmobilierCard.jsx` |
| `DividendesCard` | Suivi dividendes | `src/components/DividendesCard.jsx` |
| `ObjectifEpargneCard` | Objectif épargne | `src/components/ObjectifEpargneCard.jsx` |
| `ProjectionCard` | Projection finances | `src/components/ProjectionCard.jsx` |
| `DiversificationScore` | Score portefeuille | `src/components/DiversificationScore.jsx` |
| `PnLLatentToggle` | Toggle €/% | `src/components/PnLLatentToggle.jsx` |
| `TransactionForm` | Formulaire transaction bourse | `src/components/TransactionForm.jsx` |
| `CryptoTransactionForm` | Formulaire transaction crypto | `src/components/CryptoTransactionForm.jsx` |
| `ImportCSVModal` | Import fichiers | `src/components/ImportCSVModal.jsx` |

---

## 🔧 Installation et lancement

### Prérequis

```bash
Node.js >= 18
npm ou yarn
Compte Supabase (gratuit)
```

### Installation locale

```bash
# 1. Cloner le repo
git clone https://github.com/mathcast-30/Fondora.git
cd Fondora

# 2. Installer les dépendances
npm install

# 3. Configuration variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec vos clés Supabase

# 4. Lancer en développement
npm run dev
# L'app est accessible sur http://localhost:5173

# 5. Build production
npm run build

# 6. Preview production
npm run preview
```

### Variables d'environnement

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your_anon_key
```

### Linting

```bash
npm run lint  # Vérifier avec oxlint
```

---

## 💾 Gestion des données

### Base de données Supabase

#### Tables principales

##### `comptes`
```sql
- id (UUID)
- user_id (FK)
- nom (VARCHAR)
- type (VARCHAR: "courant", "épargne", "pea", "cto", etc.)
- solde (DECIMAL)
- devise (VARCHAR: "EUR", "USD", etc.)
- couleur (VARCHAR: hex color)
- frais_gestion_enveloppe (DECIMAL)
- frais_courtage_pourcentage (DECIMAL)
- created_at (TIMESTAMP)
```

##### `positions_bourse`
```sql
- id (UUID)
- user_id (FK)
- symbole (VARCHAR: "AAPL", "AI.PA", etc.)
- quantite (DECIMAL)
- prix_achat_moyen (DECIMAL)
- date_achat (TIMESTAMP)
- created_at (TIMESTAMP)
```

##### `transactions_investissement`
```sql
- id (UUID)
- user_id (FK)
- symbole (VARCHAR)
- quantity (DECIMAL)
- price (DECIMAL)
- type (VARCHAR: "buy", "sell")
- date (TIMESTAMP)
- fees (DECIMAL)
- type_compte (VARCHAR: "PEA", "CTO")
- created_at (TIMESTAMP)
```

##### `positions_crypto`
```sql
- id (UUID)
- user_id (FK)
- coin_id (VARCHAR)
- symbole (VARCHAR: "BTC", "ETH", etc.)
- quantite (DECIMAL)
- prix_achat_moyen (DECIMAL)
- created_at (TIMESTAMP)
```

##### `transactions_crypto`
```sql
- id (UUID)
- user_id (FK)
- coin_id (VARCHAR)
- symbole (VARCHAR)
- quantity (DECIMAL)
- price (DECIMAL)
- type (VARCHAR: "buy", "sell")
- date (TIMESTAMP)
- fees (DECIMAL)
- created_at (TIMESTAMP)
```

##### `historique_valeur_crypto`
```sql
- id (UUID)
- user_id (FK)
- valeur (DECIMAL)
- date (TIMESTAMP)
- created_at (TIMESTAMP)
```

##### `biens_immobiliers`
```sql
- id (UUID)
- user_id (FK)
- type (VARCHAR)
- adresse (VARCHAR)
- valeur_achat (DECIMAL)
- valeur_actuelle (DECIMAL)
- revenus_locatifs (DECIMAL)
- hypotheque (DECIMAL)
- taux_hypotheque (DECIMAL)
- created_at (TIMESTAMP)
```

##### `dettes`
```sql
- id (UUID)
- user_id (FK)
- type (VARCHAR: "crédit conso", "immobilier", "CB", etc.)
- montant_initial (DECIMAL)
- montant_restant (DECIMAL)
- taux_interet (DECIMAL)
- date_debut (TIMESTAMP)
- date_fin (TIMESTAMP)
- created_at (TIMESTAMP)
```

### Sécurité des données

- **Row Level Security (RLS)** : Chaque utilisateur ne voit que ses données
- **Chiffrement** : Les montants sensibles sont chiffrés en transit HTTPS
- **RGPD compliant** : Respect des droits d'accès et suppression des données
- **Export sécurisé** : Téléchargement direct sans serveur intermédiaire

### Context API

| Context | Localisation | Utilité |
|---|---|---|
| `AuthContext` | `src/context/` | Gestion authentification utilisateur |
| `CurrencyContext` | `src/context/` | Devise de référence globale |
| `IncognitoContext` | `src/context/` | Mode masquage montants |

---

## 📊 Utilitaires financiers

### `src/lib/financialCalculations.js`

Bibliothèque complète de calculs financiers :

#### Fonctions principales

```javascript
// Taux de rentabilité interne (XIRR)
calculateXIRR(cashFlows, guess = 0.1, maxIterations = 100, tolerance = 1e-6)

// Croissance annuelle composée
calculateCAGR(initialValue, finalValue, years)

// Taux de rentabilité interne français
calculateTRI(cashFlows)

// P&L par méthode FIFO (Premier Entré, Premier Sorti)
calculateFIFOPnL(transactions)

// Prix de revient unitaire (crypto)
calculatePRU(positions)

// P&L crypto avec impôts français
calculateCryptoRealizedPL(transactions)

// Formatage
formatPercentage(value, decimals = 2)
formatCurrency(value, currency = 'EUR')
```

### `src/lib/diversificationScore.js`

Calcul du score de diversification du portefeuille :

```javascript
calculateDiversificationScore(positions, total)
// Retourne: {
//   overall: 75,
//   letter: 'B',
//   breakdown: {
//     assetClass: 35,
//     sector: 25,
//     concentration: 15
//   },
//   advice: "Considérez d'augmenter la diversification..."
// }

getDiversificationColor(score)  // Couleur Tailwind
getDiversificationBgColor(score) // Couleur fond
```

---

## 📱 Aspects responsive

Tous les composants utilisent **Tailwind CSS v4** :

- **Mobile** : Optimisé pour écrans < 640px
- **Tablet** : Adapté pour écrans 640-1024px
- **Desktop** : Interface complète pour écrans > 1024px

Breakpoints utilisés : `sm`, `md`, `lg`, `xl`

---

## 🚀 Déploiement

### Vercel

L'application est actuellement déployée sur **Vercel** :

```bash
# Configuration
vercel.json:
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": ["VITE_SUPABASE_URL", "VITE_SUPABASE_KEY"]
}
```

### Variables d'environnement Vercel

À configurer dans Vercel dashboard :
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_KEY`

### Pipeline CI/CD

- Build automatique sur push vers `main`
- Tests de linting avec oxlint
- Déploiement preview pour chaque PR
- Déploiement production après merge

---

## 📄 Documents légaux

Tous les documents légaux sont stockés en Markdown :

| Document | Localisation |
|---|---|
| CGU | `cgu.md`, `src/pages/legal/CGU.jsx` |
| Politique de confidentialité | `politique-confidentialite.md`, `src/pages/legal/PolitiqueConfidentialite.jsx` |
| Mentions légales | `mentions-legales.md`, `src/pages/legal/MentionsLegales.jsx` |
| Registre des traitements | `registre-traitements.md` |

---

## 🐛 Troubleshooting

### Problème : "Cannot read property 'user' of undefined"
→ Vérifier que Supabase est correctement configuré et l'AuthContext initialisé

### Problème : Cours de bourse ne se chargent pas
→ Vérifier l'API utilisée, possibles limites de requêtes

### Problème : Export CSV échoue
→ Vérifier les permissions de téléchargement et la taille des données

---

## 🤝 Contribution

Les contributions sont bienvenues ! N'hésitez pas à créer une issue ou PR pour améliorations/corrections.

---

## 📞 Support

Pour toute question ou problème :
- Consulter la [documentation complète](IMPLEMENTATION_SUMMARY.md)
- Visiter https://fondora.vercel.app
- Lire les [conditions d'utilisation](cgu.md)

---

## 📅 Statut du projet

- ✅ Authentification & sécurité
- ✅ Gestion patrimoine
- ✅ Budget & dépenses
- ✅ Bourse & investissements
- ✅ Crypto avec calculs fiscaux français
- ✅ Immobilier
- ✅ Gestion dettes
- ✅ Analyses avancées
- ✅ Export données RGPD
- 🚀 Prêt pour utilisation

---

**Dernière mise à jour** : Juillet 2026

**Auteur** : mathcast-30

**Site** : https://fondora.vercel.app
