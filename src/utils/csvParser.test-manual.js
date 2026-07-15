import { parserCSVBrut } from './csvParser.js';
import { detecterBanque } from './bankSignatures.js';
import { normaliserLigne } from './normalisationTransactions.js';

// Exemples de fichiers CSV pour le test manuel

// 1. Exemple Boursorama (délimiteur ';', encodage UTF-8 standard, montant signé)
const csvBoursorama = `dateOp;dateVal;libelle;montant
2026-05-15;2026-05-15;ACHAT CARREFOUR;-45.20
2026-05-16;2026-05-16;VIREMENT SALAIRE;1850.00`;

// 2. Exemple Crédit Agricole (Débit/Crédit séparés, délimiteur ';', encodage UTF-8)
const csvCreditAgricole = `Date de l'opération;Libellé de l'opération;Débit;Crédit
15/05/2026;PRLVT ABONNEMENT NETFLIX;15,99;
16/05/2026;REMBOURSEMENT SANTE;;22,50`;

// 3. Exemple avec en-têtes parasites avant les données (type Fortuneo)
const csvParasite = `Export de compte no 12345
Solde au 15/05/2026 : 5000 EUR
Date opération;Libellé;Montant opération;Devise
15/05/2026;Paiement Boulanger;-129.99;EUR
16/05/2026;Virement Externe;300.00;EUR`;

async function executerTests() {
  console.log("=== DÉMARRAGE DES TESTS MANUELS DE PARSING ET DE NORMALISATION ===\n");
  const compteId = "compte_test_123";

  // --- Test 1 : Boursorama ---
  console.log("--- TEST 1 : Boursorama ---");
  const rawBoursorama = parserCSVBrut(csvBoursorama);
  console.log("Détection en-têtes :", rawBoursorama.headers);
  console.log("Détecté Délimiteur :", rawBoursorama.delimiteur);
  console.log("Détecté Encodage :", rawBoursorama.encodage);
  const banqueBoursorama = detecterBanque(rawBoursorama.headers);
  console.log("Banque détectée :", banqueBoursorama ? banqueBoursorama.nom : "Inconnue");
  
  if (banqueBoursorama) {
    const transactions = [];
    for (const ligne of rawBoursorama.lignes) {
      if (ligne[banqueBoursorama.colonnes.date]) {
        const tx = await normaliserLigne(ligne, banqueBoursorama, compteId);
        transactions.push(tx);
      }
    }
    console.log("Transactions normalisées :", JSON.stringify(transactions, null, 2));
  }
  console.log("\n");

  // --- Test 2 : Crédit Agricole ---
  console.log("--- TEST 2 : Crédit Agricole (Débit/Crédit) ---");
  const rawCA = parserCSVBrut(csvCreditAgricole);
  console.log("Détection en-têtes :", rawCA.headers);
  console.log("Détecté Délimiteur :", rawCA.delimiteur);
  const banqueCA = detecterBanque(rawCA.headers);
  console.log("Banque détectée :", banqueCA ? banqueCA.nom : "Inconnue");

  if (banqueCA) {
    const transactions = [];
    for (const ligne of rawCA.lignes) {
      if (ligne[banqueCA.colonnes.date]) {
        const tx = await normaliserLigne(ligne, banqueCA, compteId);
        transactions.push(tx);
      }
    }
    console.log("Transactions normalisées :", JSON.stringify(transactions, null, 2));
  }
  console.log("\n");

  // --- Test 3 : En-têtes Parasites (Fortuneo) ---
  console.log("--- TEST 3 : En-têtes parasites ---");
  const rawParasite = parserCSVBrut(csvParasite);
  console.log("Index début des données (attendu 2) :", rawParasite.indexDebutDonnees);
  console.log("Détection en-têtes :", rawParasite.headers);
  const banqueParasite = detecterBanque(rawParasite.headers);
  console.log("Banque détectée :", banqueParasite ? banqueParasite.nom : "Inconnue");

  if (banqueParasite) {
    const transactions = [];
    for (const ligne of rawParasite.lignes) {
      if (ligne[banqueParasite.colonnes.date]) {
        const tx = await normaliserLigne(ligne, banqueParasite, compteId);
        transactions.push(tx);
      }
    }
    console.log("Transactions normalisées :", JSON.stringify(transactions, null, 2));
  }
  console.log("\n=== FIN DES TESTS ===");
}

executerTests().catch(console.error);
