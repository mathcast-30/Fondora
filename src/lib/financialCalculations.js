/**
 * Financial Calculations Utility Library
 * Implements XIRR, TRI, CAGR, FIFO/PEPS, and PRU calculations for investment tracking
 */

/**
 * Calculates XIRR (Extended Internal Rate of Return) using Newton-Raphson method
 * @param {Array<{date: Date|string, amount: number}>} cashFlows - Array of cash flows (positive for income, negative for expenses)
 * @param {number} [guess=0.1] - Initial guess for the rate (default: 10%)
 * @param {number} [maxIterations=100] - Maximum iterations for convergence
 * @param {number} [tolerance=1e-6] - Tolerance for convergence
 * @returns {number|null} XIRR as a decimal (e.g., 0.1234 for 12.34%) or null if calculation fails
 */
export function calculateXIRR(cashFlows, guess = 0.1, maxIterations = 100, tolerance = 1e-6) {
    if (!cashFlows || cashFlows.length < 2) return null;
    
    // Parse dates and sort by date
    const flows = cashFlows
        .map(cf => ({
            date: cf.date instanceof Date ? cf.date : new Date(cf.date),
            amount: cf.amount
        }))
        .sort((a, b) => a.date - b.date);
    
    // Check if we have at least one positive and one negative cash flow
    const hasPositive = flows.some(cf => cf.amount > 0);
    const hasNegative = flows.some(cf => cf.amount < 0);
    if (!hasPositive || !hasNegative) return null;
    
    const firstDate = flows[0].date;
    
    // Newton-Raphson method
    let rate = guess;
    let iteration = 0;
    let lastValue = 0;
    
    while (iteration < maxIterations) {
        let sum = 0;
        let derivativeSum = 0;
        
        for (const cf of flows) {
            const days = (cf.date - firstDate) / (1000 * 60 * 60 * 24);
            const years = days / 365.25;
            const discountFactor = Math.pow(1 + rate, years);
            
            sum += cf.amount / discountFactor;
            derivativeSum += -cf.amount * years / Math.pow(1 + rate, years + 1);
        }
        
        const newValue = rate - sum / derivativeSum;
        
        if (Math.abs(newValue - rate) < tolerance) {
            return newValue;
        }
        
        if (Math.abs(newValue - lastValue) < tolerance) {
            // Avoid infinite loop with minimal changes
            break;
        }
        
        lastValue = rate;
        rate = newValue;
        iteration++;
    }
    
    return null; // Failed to converge
}

/**
 * Calculates CAGR (Compound Annual Growth Rate)
 * @param {number} initialValue - Initial investment value
 * @param {number} finalValue - Final investment value
 * @param {number} years - Number of years
 * @returns {number} CAGR as a decimal (e.g., 0.1234 for 12.34%)
 */
export function calculateCAGR(initialValue, finalValue, years) {
    if (initialValue === 0 || years <= 0) return 0;
    return Math.pow(finalValue / initialValue, 1 / years) - 1;
}

/**
 * Calculates TRI (Taux de Rentabilité Interne) - French equivalent of IRR
 * Uses XIRR calculation as the basis
 * @param {Array<{date: Date|string, amount: number}>} cashFlows - Array of cash flows
 * @returns {number|null} TRI as a decimal
 */
export function calculateTRI(cashFlows) {
    return calculateXIRR(cashFlows);
}

/**
 * Implements FIFO (First-In, First-Out) / PEPS (Premier Entré, Premier Sorti) method
 * for calculating realized P&L on stock sales
 * @param {Array<{date: Date|string, quantity: number, price: number, type: 'buy'|'sell'}>} transactions - Array of buy and sell transactions
 * @returns {Object} Object containing realized P&L, cost basis, and transaction details
 */
export function calculateFIFOPnL(transactions) {
    if (!transactions || transactions.length === 0) {
        return { realizedPL: 0, totalCost: 0, totalProceeds: 0, remainingPositions: [] };
    }
    
    // Sort transactions by date (oldest first)
    const sortedTransactions = [...transactions]
        .map(t => ({
            ...t,
            date: t.date instanceof Date ? t.date : new Date(t.date)
        }))
        .sort((a, b) => a.date - b.date);
    
    const inventory = []; // Stack of available positions (FIFO)
    let realizedPL = 0;
    let totalCost = 0;
    let totalProceeds = 0;
    const saleDetails = [];
    
    for (const tx of sortedTransactions) {
        if (tx.type === 'buy') {
            // Add to inventory
            inventory.push({
                quantity: tx.quantity,
                price: tx.price,
                date: tx.date
            });
            totalCost += tx.quantity * tx.price;
        } else if (tx.type === 'sell') {
            let remainingQuantity = tx.quantity;
            let totalCostForSale = 0;
            const lotsSold = [];
            
            // Sell from oldest positions first (FIFO)
            while (remainingQuantity > 0 && inventory.length > 0) {
                const oldest = inventory[0];
                const sellQuantity = Math.min(remainingQuantity, oldest.quantity);
                const costForThisLot = sellQuantity * oldest.price;
                
                lotsSold.push({
                    quantity: sellQuantity,
                    price: oldest.price,
                    date: oldest.date
                });
                
                totalCostForSale += costForThisLot;
                remainingQuantity -= sellQuantity;
                
                // Update or remove from inventory
                if (oldest.quantity > sellQuantity) {
                    oldest.quantity -= sellQuantity;
                } else {
                    inventory.shift();
                }
            }
            
            const proceeds = tx.quantity * tx.price;
            const costBasis = totalCostForSale;
            const plForSale = proceeds - costBasis;
            
            realizedPL += plForSale;
            totalProceeds += proceeds;
            
            saleDetails.push({
                date: tx.date,
                quantity: tx.quantity,
                salePrice: tx.price,
                costBasis: totalCostForSale / tx.quantity,
                pl: plForSale,
                lots: lotsSold
            });
        }
    }
    
    return {
        realizedPL,
        totalCost,
        totalProceeds,
        remainingPositions: inventory,
        saleDetails
    };
}

/**
 * Calculates PRU (Prix de Revient Unitaire) pondéré for French crypto tax rules
 * PRU is the weighted average cost per unit for the entire crypto portfolio
 * @param {Array<{quantity: number, price: number}>} positions - Current crypto positions
 * @returns {number} Weighted average cost per unit
 */
export function calculatePRU(positions) {
    if (!positions || positions.length === 0) return 0;
    
    const totalQuantity = positions.reduce((sum, p) => sum + p.quantity, 0);
    const totalCost = positions.reduce((sum, p) => sum + (p.quantity * p.price), 0);
    
    return totalCost / totalQuantity;
}

/**
 * Calculates realized P&L for crypto using French tax rules (PRU method)
 * In France, crypto sales use PRU (Prix de Revient Unitaire) pondéré for the entire portfolio
 * @param {Array<{date: Date|string, quantity: number, price: number, type: 'buy'|'sell'}>} transactions - All crypto transactions
 * @returns {Object} Object containing realized P&L and tax information
 */
export function calculateCryptoRealizedPL(transactions) {
    if (!transactions || transactions.length === 0) {
        return { realizedPL: 0, totalCost: 0, totalProceeds: 0, pruHistory: [] };
    }
    
    // Sort transactions by date
    const sortedTransactions = [...transactions]
        .map(t => ({
            ...t,
            date: t.date instanceof Date ? t.date : new Date(t.date)
        }))
        .sort((a, b) => a.date - b.date);
    
    let realizedPL = 0;
    let totalCost = 0;
    let totalProceeds = 0;
    let currentHoldings = []; // Current positions in portfolio
    const pruHistory = [];
    
    for (const tx of sortedTransactions) {
        if (tx.type === 'buy') {
            currentHoldings.push({
                quantity: tx.quantity,
                price: tx.price,
                date: tx.date
            });
            totalCost += tx.quantity * tx.price;
            
            // Calculate current PRU
            const currentPRU = calculatePRU(currentHoldings);
            pruHistory.push({
                date: tx.date,
                pru: currentPRU,
                totalQuantity: currentHoldings.reduce((sum, p) => sum + p.quantity, 0)
            });
        } else if (tx.type === 'sell') {
            const pruBefore = calculatePRU(currentHoldings);
            
            const proceeds = tx.quantity * tx.price;
            const costBasis = tx.quantity * pruBefore;
            const plForSale = proceeds - costBasis;
            
            realizedPL += plForSale;
            totalProceeds += proceeds;
            
            // Remove sold quantity from holdings (FIFO for tracking, but PRU for tax)
            let remainingQuantity = tx.quantity;
            while (remainingQuantity > 0 && currentHoldings.length > 0) {
                const position = currentHoldings[0];
                const sellQuantity = Math.min(remainingQuantity, position.quantity);
                
                if (position.quantity > sellQuantity) {
                    position.quantity -= sellQuantity;
                } else {
                    currentHoldings.shift();
                }
                
                remainingQuantity -= sellQuantity;
            }
            
            // Update PRU after sale
            if (currentHoldings.length > 0) {
                const currentPRU = calculatePRU(currentHoldings);
                pruHistory.push({
                    date: tx.date,
                    pru: currentPRU,
                    totalQuantity: currentHoldings.reduce((sum, p) => sum + p.quantity, 0)
                });
            }
        }
    }
    
    return {
        realizedPL,
        totalCost,
        totalProceeds,
        pruHistory,
        currentPRU: calculatePRU(currentHoldings)
    };
}

/**
 * Formats a number as a percentage
 * @param {number} value - The value to format
 * @param {number} [decimals=2] - Number of decimal places
 * @returns {string} Formatted percentage string
 */
export function formatPercentage(value, decimals = 2) {
    return (value * 100).toFixed(decimals) + '%';
}

/**
 * Formats a monetary value
 * @param {number} value - The value to format
 * @param {string} [currency='EUR'] - Currency code
 * @returns {string} Formatted currency string
 */
export function formatCurrency(value, currency = 'EUR') {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currency
    }).format(value);
}

// ============================================================
// ASSURANCE VIE — Fonctions de calcul financier et fiscal
// Étape 11.1 | Règles fiscales 2026
// ============================================================

/**
 * Calcule les versements totaux (base de calcul du PRU / coût de revient).
 * @param {Array<{montant: number}>} versements - Tableau des versements
 * @returns {number} Somme des montants versés
 */
export function calculerVersementsTotaux(versements) {
    if (!versements || versements.length === 0) return 0;
    return versements.reduce((acc, v) => acc + Number(v.montant), 0);
}

/**
 * Calcule la valeur actuelle d'un contrat AV :
 *   [Dernière valorisation Fonds Euros] + [Σ (nb_parts × dernier_prix) pour les UC]
 *
 * Le prix de marché des UC est lu EXCLUSIVEMENT depuis asset_prices_cache
 * (fourni par le hook useAssurancesVie). NE JAMAIS appeler Finnhub ici.
 *
 * @param {number} valeurFondsEuros - Dernière valeur du compartiment Fonds Euros (ex: 5000)
 * @param {Array<{isin: string, nb_parts: number}>} positionsUC - Positions en UC
 * @param {Object<string, {dernier_prix: number|null}>} prixCache - Map isin → { dernier_prix }
 * @returns {{ total: number, ucDisponibles: boolean }} Valeur totale et flag si tous les prix sont connus
 */
export function calculerValeurActuelleContrat(valeurFondsEuros, positionsUC, prixCache) {
    const fonds = Number(valeurFondsEuros) || 0;

    if (!positionsUC || positionsUC.length === 0) {
        return { total: fonds, ucDisponibles: true };
    }

    let totalUC = 0;
    let tousLesPrixConnus = true;

    for (const pos of positionsUC) {
        const cache = prixCache?.[pos.isin];
        const prix = cache?.dernier_prix;
        if (prix != null && prix > 0) {
            totalUC += Number(pos.nb_parts) * Number(prix);
        } else {
            // Prix indisponible : on exclut cette UC de la valorisation
            tousLesPrixConnus = false;
        }
    }

    return { total: fonds + totalUC, ucDisponibles: tousLesPrixConnus };
}

/**
 * Calcule la performance globale d'un contrat AV.
 * @param {number} valeurActuelle - Valeur actuelle du contrat
 * @param {number} versementsTotaux - Somme de tous les versements (PRU)
 * @returns {{ euros: number, pourcentage: number }} Performance en € et en %
 */
export function calculerPerformanceAV(valeurActuelle, versementsTotaux) {
    if (!versementsTotaux || versementsTotaux === 0) {
        return { euros: 0, pourcentage: 0 };
    }
    const euros = valeurActuelle - versementsTotaux;
    const pourcentage = (euros / versementsTotaux) * 100;
    return { euros, pourcentage };
}

/**
 * Calcule le XIRR (Taux de Rendement Interne étendu) pour un contrat AV.
 * Méthode : les versements sont des flux NÉGATIFS (sorties de cash),
 * et la valeur actuelle est le flux POSITIF final (entrée théorique à la date d'évaluation).
 *
 * Délègue au calculateXIRR existant.
 *
 * @param {Array<{date: string, montant: number}>} versements - Versements historiques
 * @param {number} valeurActuelle - Valeur du contrat à la date d'évaluation
 * @param {Date|string} [dateEvaluation] - Date d'évaluation (défaut : aujourd'hui)
 * @returns {number|null} XIRR en décimal (ex: 0.045 = 4,5 %) ou null si < 2 flux
 */
export function calculerXIRR_AV(versements, valeurActuelle, dateEvaluation) {
    if (!versements || versements.length === 0) return null;
    if (!valeurActuelle || valeurActuelle <= 0) return null;

    const dateRef = dateEvaluation
        ? new Date(dateEvaluation)
        : new Date();

    // Construction des flux : versements = sorties (négatifs), valeur = entrée (positive)
    const cashFlows = [
        ...versements.map((v) => ({
            date: new Date(v.date),
            amount: -Math.abs(Number(v.montant)),
        })),
        { date: dateRef, amount: valeurActuelle },
    ];

    // Nécessite au moins 2 flux (versement + valeur actuelle)
    if (cashFlows.length < 2) return null;

    return calculateXIRR(cashFlows);
}

/**
 * Calcule les frais annuels cumulés d'un contrat AV.
 * CORRECTION : additionne frais d'enveloppe + TER moyen des UC pondéré.
 * Génère une alerte si frais_gestion_enveloppe > 1 %.
 *
 * @param {number} fraisEnveloppe - Frais de gestion de l'assureur en % (ex: 0.60)
 * @param {number} fraisTerMoyen - TER moyen pondéré des UC en % (ex: 0.20), 0 si pas d'UC
 * @param {number} valeurActuelle - Valeur actuelle du contrat en €
 * @returns {{
 *   fraisTotalPct: number,   // Frais cumulés en % (enveloppe + TER)
 *   fraisAnnuelsEuros: number, // Frais annuels en €
 *   alerteFreisEleves: boolean // true si fraisEnveloppe > 1 %
 * }}
 */
export function calculerFraisAV(fraisEnveloppe, fraisTerMoyen, valeurActuelle) {
    const env = Number(fraisEnveloppe) || 0;
    const ter = Number(fraisTerMoyen) || 0;
    const valeur = Number(valeurActuelle) || 0;

    const fraisTotalPct = env + ter;
    const fraisAnnuelsEuros = valeur * (fraisTotalPct / 100);
    const alerteFreisEleves = env > 1;

    return { fraisTotalPct, fraisAnnuelsEuros, alerteFreisEleves };
}

/**
 * Calcule le manque à gagner cumulé par rapport à un contrat optimisé (0,50 % d'enveloppe)
 * sur 10, 20 et 30 ans, sur la base d'un rendement théorique de 6 %/an.
 *
 * Méthode : intérêts composés avec traînée de frais différentielle.
 *   Capital_actuel   = V × (1 + (6% − fraisTotal%) / 100) ^ N
 *   Capital_optimisé = V × (1 + (6% − 0.50% − fraisTerMoyen%) / 100) ^ N
 *   Manque à gagner  = Capital_optimisé − Capital_actuel  (positif si frais > 0.50%)
 *
 * @param {number} valeurActuelle - Valeur actuelle du contrat en €
 * @param {number} fraisEnveloppe - Frais d'enveloppe actuels en % (ex: 1.50)
 * @param {number} fraisTerMoyen - TER moyen des UC en % (ex: 0.20)
 * @returns {{
 *   ans10: number,  // Manque à gagner sur 10 ans en €
 *   ans20: number,  // Manque à gagner sur 20 ans en €
 *   ans30: number,  // Manque à gagner sur 30 ans en €
 *   graphique: Array<{annee: number, capitalActuel: number, capitalOptimise: number}>
 * }}
 */
export function calculerManqueAGagner(valeurActuelle, fraisEnveloppe, fraisTerMoyen) {
    const V = Number(valeurActuelle) || 0;
    const env = Number(fraisEnveloppe) || 0;
    const ter = Number(fraisTerMoyen) || 0;

    const RENDEMENT_BRUT = 6;           // % rendement théorique marché
    const FRAIS_ENVELOPPE_REF = 0.5;    // % enveloppe du contrat optimisé de référence

    const tauxActuel = (RENDEMENT_BRUT - env - ter) / 100;
    const tauxOptimise = (RENDEMENT_BRUT - FRAIS_ENVELOPPE_REF - ter) / 100;

    const projeter = (capital, taux, annees) =>
        capital * Math.pow(1 + taux, annees);

    const horizons = new Set([10, 20, 30]);
    const resultats = {};
    const graphique = [];

    for (let annee = 1; annee <= 30; annee++) {
        const capitalActuel = projeter(V, tauxActuel, annee);
        const capitalOptimise = projeter(V, tauxOptimise, annee);
        graphique.push({ annee, capitalActuel, capitalOptimise });

        if (horizons.has(annee)) {
            resultats[`ans${annee}`] = Math.max(0, capitalOptimise - capitalActuel);
        }
    }

    return {
        ans10: resultats.ans10,
        ans20: resultats.ans20,
        ans30: resultats.ans30,
        graphique,
    };
}

/**
 * Calcule la fiscalité latente d'un rachat partiel sur un contrat AV.
 * Règles fiscales 2026 — Assurance Vie :
 *
 * ► Prélèvements Sociaux (PS) : TOUJOURS 17,2 % (l'AV est PROTÉGÉE en 2026,
 *   contrairement au PEA/CTO passés à 18,6 %).
 *
 * ► Contrat < 8 ans :
 *   - PFU (Flat Tax) = 12,8 % d'impôt + 17,2 % PS = 30 % sur la quote-part de gains
 *
 * ► Contrat ≥ 8 ans :
 *   - Abattement annuel sur la quote-part de gains :
 *       · 4 600 € (célibataire / autre)
 *       · 9 200 € (marié ou pacsé — situation_familiale === 'marie')
 *   - Sur les gains > abattement : 7,5 % d'impôt + 17,2 % PS = 24,7 %
 *
 * ► Calcul de la quote-part de plus-value dans le retrait (rachat partiel) :
 *   La fiscalité NE porte PAS sur le montant total du retrait mais uniquement
 *   sur la fraction représentant des gains :
 *     Quote-part = montantRetrait × (gains_totaux / valeurActuelle)
 *   où gains_totaux = valeurActuelle − versementsTotaux.
 *
 * @param {number} montantRetrait - Montant hypothétique de rachat partiel en €
 * @param {number} versementsTotaux - Total des versements effectués (PRU)
 * @param {number} valeurActuelle - Valeur actuelle du contrat
 * @param {Date|string} dateOuverture - Date d'ouverture du contrat
 * @param {string} situationFamiliale - 'marie' | autre (lecture depuis profile AuthContext)
 * @returns {{
 *   ageContratAns: number,       // Âge du contrat en années
 *   regimeFiscal: string,        // 'PFU' | 'AV_8ANS'
 *   gainsTotaux: number,         // Plus-value latente totale en €
 *   quotePart: number,           // Fraction des gains dans le retrait en €
 *   abattement: number,          // Abattement appliqué (0 si < 8 ans)
 *   baseImposable: number,       // Gains imposables après abattement
 *   impotRevenu: number,         // Impôt sur le revenu en €
 *   prelevementsSociaux: number, // PS à 17,2 % sur la quote-part en €
 *   impotTotal: number,          // Total fiscalité (IR + PS) en €
 *   tauxEffectif: number,        // Taux effectif global en % sur la quote-part
 *   anneesAvantOptimum: number | null // Années restantes avant 8 ans (null si déjà ≥ 8 ans)
 * }}
 */
export function calculerFiscaliteAV(
    montantRetrait,
    versementsTotaux,
    valeurActuelle,
    dateOuverture,
    situationFamiliale
) {
    const TAUX_PS = 0.172;              // Prélèvements sociaux AV 2026 (protégé)
    const TAUX_IR_PFU = 0.128;         // Impôt revenu < 8 ans (Flat Tax)
    const TAUX_IR_8ANS = 0.075;        // Impôt revenu ≥ 8 ans

    const retrait = Number(montantRetrait) || 0;
    const versements = Number(versementsTotaux) || 0;
    const valeur = Number(valeurActuelle) || 0;

    // Calcul de l'âge du contrat
    const dateRef = new Date();
    const dateOuv = new Date(dateOuverture);
    const ageMs = dateRef - dateOuv;
    const ageContratAns = ageMs / (1000 * 60 * 60 * 24 * 365.25);

    // Gains totaux latents
    const gainsTotaux = Math.max(0, valeur - versements);

    // Quote-part de plus-value dans le rachat partiel
    // Si le contrat est en perte, pas de fiscalité sur les gains
    const quotePart = valeur > 0 && gainsTotaux > 0
        ? retrait * (gainsTotaux / valeur)
        : 0;

    // Abattement et régime fiscal
    let abattement = 0;
    let tauxIR = 0;
    let regimeFiscal = '';
    let anneesAvantOptimum = null;

    if (ageContratAns < 8) {
        regimeFiscal = 'PFU';
        tauxIR = TAUX_IR_PFU;
        anneesAvantOptimum = Math.ceil(8 - ageContratAns);
    } else {
        regimeFiscal = 'AV_8ANS';
        tauxIR = TAUX_IR_8ANS;
        abattement = situationFamiliale === 'marie' ? 9200 : 4600;
    }

    const baseImposable = Math.max(0, quotePart - abattement);
    const impotRevenu = baseImposable * tauxIR;
    // PS s'applique sur toute la quote-part (avant abattement)
    const prelevementsSociaux = quotePart * TAUX_PS;
    const impotTotal = impotRevenu + prelevementsSociaux;
    const tauxEffectif = quotePart > 0 ? (impotTotal / quotePart) * 100 : 0;

    return {
        ageContratAns,
        regimeFiscal,
        gainsTotaux,
        quotePart,
        abattement,
        baseImposable,
        impotRevenu,
        prelevementsSociaux,
        impotTotal,
        tauxEffectif,
        anneesAvantOptimum,
    };
}

/**
 * Génère les séries de données pour le graphique Recharts comparant l'évolution
 * du capital avec les frais actuels VS un contrat optimisé à 0,50 % d'enveloppe.
 * Renvoie 30 points de données (une valeur par année).
 *
 * @param {number} valeurActuelle - Valeur de départ en €
 * @param {number} fraisEnveloppe - Frais d'enveloppe actuels en %
 * @param {number} fraisTerMoyen - TER moyen des UC en %
 * @returns {Array<{
 *   annee: number,
 *   capitalActuel: number,
 *   capitalOptimise: number,
 *   ecart: number
 * }>} Données pour Recharts
 */
export function genererDonneesGraphiqueFrais(valeurActuelle, fraisEnveloppe, fraisTerMoyen) {
    const { graphique } = calculerManqueAGagner(valeurActuelle, fraisEnveloppe, fraisTerMoyen);
    return graphique.map((point) => ({
        ...point,
        ecart: Math.max(0, point.capitalOptimise - point.capitalActuel),
    }));
}
