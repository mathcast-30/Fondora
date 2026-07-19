const SYMBOLES_DEVISES = {
    EUR: '€',
    USD: '$',
    GBP: '£',
    CHF: 'Fr',
    JPY: '¥',
    CAD: 'CA$',
    AUD: 'A$',
    SEK: 'kr',
    NOK: 'kr',
    DKK: 'kr'
};

export const DEVISES_DISPONIBLES = [
    'EUR', 'USD', 'GBP', 'CHF', 'JPY', 
    'CAD', 'AUD', 'SEK', 'NOK', 'DKK'
];

export function getSymboleDevise(codeDevise) {
    return SYMBOLES_DEVISES[codeDevise] || codeDevise;
}

export function getZoneEuro(codeDevise) {
    const zoneEuro = ['EUR', 'XOF', 'XAF', 'XPF'];
    return zoneEuro.includes(codeDevise);
}

export function calculerFraisChange(montant, deviseSrc, deviseDst) {
    if (getZoneEuro(deviseSrc) && getZoneEuro(deviseDst)) {
        return { fraisMin: 0, fraisMax: 0, applicable: false };
    }

    const fraisMin = montant * 0.001; // 0.1%
    const fraisMax = montant * 0.005; // 0.5%
    return { fraisMin, fraisMax, applicable: true };
}

export function calculerDecompositionGain(prixAchatDevise, prixActuelDevise, tauxAchat, tauxActuel) {
    const gainDevise = ((prixActuelDevise - prixAchatDevise) / prixAchatDevise) * 100;
    const gainChange = ((tauxActuel - tauxAchat) / tauxAchat) * 100;
    
    const prixAchatEur = prixAchatDevise / tauxAchat;
    const prixActuelEur = prixActuelDevise / tauxActuel;
    const gainTotal = ((prixActuelEur - prixAchatEur) / prixAchatEur) * 100;

    return { gainDevise, gainChange, gainTotal };
}

export function formaterMontantAvecDevise(montant, devise, locale = 'fr-FR') {
    if (montant === undefined || montant === null || isNaN(montant)) {
        return '';
    }
    
    // Check if the currency is supported by Intl.NumberFormat
    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: devise
        }).format(montant);
    } catch (e) {
        // Fallback for unsupported currencies (like crypto)
        return `${new Intl.NumberFormat(locale).format(montant)} ${getSymboleDevise(devise)}`;
    }
}
