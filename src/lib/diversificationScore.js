/**
 * Diversification Score Calculation
 * Calculates a dynamic diversification score based on asset and sector allocation
 */

/**
 * Calculates diversification score based on allocation
 * @param {Array<{nom: string, montant: number, secteur?: string, type?: string}>} positions - Array of positions with amount and optional sector/type
 * @param {number} total - Total portfolio value
 * @returns {Object} Object containing score (0-100) and breakdown
 */
export function calculateDiversificationScore(positions, total) {
    if (!positions || positions.length === 0 || total === 0) {
        return { score: 0, breakdown: {}, advice: 'Ajoute des positions pour calculer la diversification' };
    }
    
    // Calculate weights
    const weights = positions.map(p => ({
        ...p,
        weight: p.montant / total
    }));
    
    // 1. Asset Class Diversification (0-40 points)
    const assetClassScore = calculateAssetClassDiversification(weights);
    
    // 2. Sector Diversification (0-30 points)
    const sectorScore = calculateSectorDiversification(weights);
    
    // 3. Position Concentration (0-30 points)
    const concentrationScore = calculateConcentrationScore(weights);
    
    const totalScore = assetClassScore + sectorScore + concentrationScore;
    
    // Generate advice
    const advice = generateDiversificationAdvice(assetClassScore, sectorScore, concentrationScore, weights);
    
    return {
        score: Math.round(totalScore),
        breakdown: {
            assetClass: assetClassScore,
            sector: sectorScore,
            concentration: concentrationScore
        },
        advice,
        grade: getDiversificationGrade(totalScore)
    };
}

/**
 * Calculates score based on asset class diversification
 * @param {Array} weights - Positions with weights
 * @returns {number} Score (0-40)
 */
function calculateAssetClassDiversification(weights) {
    // Define asset classes based on type or name patterns
    const assetClasses = {
        'actions': ['action', 'etf', 'stock', 'equity'],
        'obligations': ['bond', 'obligation', 'fixed income'],
        'crypto': ['crypto', 'bitcoin', 'ethereum', 'btc', 'eth'],
        'immobilier': ['immobilier', 'real estate', 'property'],
        'liquides': ['liquide', 'cash', 'livret', 'compte']
    };
    
    // Categorize positions
    const classWeights = {};
    
    for (const w of weights) {
        let foundClass = 'autres';
        
        for (const [className, keywords] of Object.entries(assetClasses)) {
            const nameLower = (w.nom || '').toLowerCase();
            const typeLower = (w.type || '').toLowerCase();
            
            if (keywords.some(kw => nameLower.includes(kw) || typeLower.includes(kw))) {
                foundClass = className;
                break;
            }
        }
        
        classWeights[foundClass] = (classWeights[foundClass] || 0) + w.weight;
    }
    
    const classes = Object.keys(classWeights);
    
    // Score based on number of asset classes and their distribution
    if (classes.length === 1) {
        return 0; // No diversification
    } else if (classes.length === 2) {
        // Check if reasonably balanced
        const values = Object.values(classWeights);
        const maxWeight = Math.max(...values);
        return maxWeight <= 0.8 ? 20 : 10; // Partial diversification
    } else if (classes.length === 3) {
        const values = Object.values(classWeights);
        const maxWeight = Math.max(...values);
        return maxWeight <= 0.7 ? 30 : 20;
    } else if (classes.length >= 4) {
        const values = Object.values(classWeights);
        const maxWeight = Math.max(...values);
        return maxWeight <= 0.6 ? 40 : 30;
    }
    
    return 0;
}

/**
 * Calculates score based on sector diversification
 * @param {Array} weights - Positions with weights and sectors
 * @returns {number} Score (0-30)
 */
function calculateSectorDiversification(weights) {
    // Extract sectors from positions
    const sectorWeights = {};
    
    for (const w of weights) {
        const sector = w.secteur || inferSectorFromName(w.nom) || 'inconnu';
        sectorWeights[sector] = (sectorWeights[sector] || 0) + w.weight;
    }
    
    const sectors = Object.keys(sectorWeights);
    
    if (sectors.length === 1) {
        return 0; // No sector diversification
    } else if (sectors.length === 2) {
        const values = Object.values(sectorWeights);
        const maxWeight = Math.max(...values);
        return maxWeight <= 0.7 ? 15 : 10;
    } else if (sectors.length === 3) {
        const values = Object.values(sectorWeights);
        const maxWeight = Math.max(...values);
        return maxWeight <= 0.6 ? 22 : 15;
    } else if (sectors.length >= 4) {
        const values = Object.values(sectorWeights);
        const maxWeight = Math.max(...values);
        return maxWeight <= 0.5 ? 30 : 22;
    }
    
    return 0;
}

/**
 * Infers sector from position name
 * @param {string} name - Position name
 * @returns {string|null} Inferred sector or null
 */
function inferSectorFromName(name) {
    if (!name) return null;
    
    const nameLower = name.toLowerCase();
    
    const sectorKeywords = {
        'technologie': ['tech', 'technology', 'software', 'internet', 'cloud', 'ai', 'intelligence artificielle'],
        'finance': ['bank', 'finance', 'financial', 'bancaire', 'assurance'],
        'santé': ['health', 'santé', 'pharma', 'pharmaceutical', 'biotech', 'médical'],
        'énergie': ['energy', 'énergie', 'oil', 'pétrole', 'gas', 'électricité', 'renouvelable'],
        'consommation': ['consumer', 'consommation', 'retail', 'distribution', 'alimentation'],
        'industrie': ['industry', 'industrie', 'manufacturing', 'automobile', 'aéronautique'],
        'immobilier': ['real estate', 'immobilier', 'property'],
        'matières premières': ['commodity', 'matière première', 'or', 'gold', 'silver', 'argent']
    };
    
    for (const [sector, keywords] of Object.entries(sectorKeywords)) {
        if (keywords.some(kw => nameLower.includes(kw))) {
            return sector;
        }
    }
    
    return null;
}

/**
 * Calculates score based on position concentration
 * @param {Array} weights - Positions with weights
 * @returns {number} Score (0-30)
 */
function calculateConcentrationScore(weights) {
    // Check if any single position exceeds certain thresholds
    const maxWeight = Math.max(...weights.map(w => w.weight));
    
    if (maxWeight > 0.5) {
        return 0; // Too concentrated
    } else if (maxWeight > 0.4) {
        return 10;
    } else if (maxWeight > 0.3) {
        return 20;
    } else if (maxWeight > 0.2) {
        return 25;
    } else {
        return 30; // Well diversified
    }
}

/**
 * Generates diversification advice based on scores
 * @param {number} assetClassScore - Asset class diversification score
 * @param {number} sectorScore - Sector diversification score
 * @param {number} concentrationScore - Concentration score
 * @param {Array} weights - Positions with weights
 * @returns {string} Advice message
 */
function generateDiversificationAdvice(assetClassScore, sectorScore, concentrationScore, weights) {
    const adviceParts = [];
    
    // Asset class advice
    if (assetClassScore < 20) {
        adviceParts.push('Diversifie tes classes d\'actifs (actions, obligations, crypto, immobilier).');
    }
    
    // Sector advice
    if (sectorScore < 15) {
        adviceParts.push('Répartis tes investissements sur plusieurs secteurs d\'activité.');
    }
    
    // Concentration advice
    const maxWeight = Math.max(...weights.map(w => w.weight));
    if (maxWeight > 0.3) {
        adviceParts.push(`Ta position la plus importante représente ${(maxWeight * 100).toFixed(1)}% de ton portefeuille. Réduis cette concentration.`);
    }
    
    // Positive feedback
    if (assetClassScore >= 30 && sectorScore >= 20 && concentrationScore >= 25) {
        adviceParts.unshift('✅ Ton portefeuille est bien diversifié ! ');
    }
    
    return adviceParts.length > 0 ? adviceParts.join(' ') : 'Ton portefeuille a une diversification équilibrée.';
}

/**
 * Gets a letter grade for the diversification score
 * @param {number} score - Diversification score (0-100)
 * @returns {string} Letter grade (A, B, C, D, F)
 */
function getDiversificationGrade(score) {
    if (score >= 80) return 'A';
    if (score >= 60) return 'B';
    if (score >= 40) return 'C';
    if (score >= 20) return 'D';
    return 'F';
}

/**
 * Gets color for the diversification grade
 * @param {number} score - Diversification score (0-100)
 * @returns {string} Tailwind CSS color class
 */
export function getDiversificationColor(score) {
    if (score >= 80) return 'text-emerald';
    if (score >= 60) return 'text-blue-500';
    if (score >= 40) return 'text-yellow-500';
    if (score >= 20) return 'text-orange-500';
    return 'text-red-500';
}

/**
 * Gets background color for the diversification grade
 * @param {number} score - Diversification score (0-100)
 * @returns {string} Tailwind CSS background color class
 */
export function getDiversificationBgColor(score) {
    if (score >= 80) return 'bg-emerald/10';
    if (score >= 60) return 'bg-blue-500/10';
    if (score >= 40) return 'bg-yellow-500/10';
    if (score >= 20) return 'bg-orange-500/10';
    return 'bg-red-500/10';
}
