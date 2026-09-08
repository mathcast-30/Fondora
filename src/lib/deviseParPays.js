export const DEVISE_PAR_PAYS = {
    'États-Unis': 'USD',
    'Canada': 'CAD',
    'Japon': 'JPY',
    'Royaume-Uni': 'GBP',
    'Suisse': 'CHF',
    'Chine': 'CNY',
    'Inde': 'INR',
    'Taiwan': 'TWD',
    'Taïwan': 'TWD',
    'Corée du Sud': 'KRW',
    'Brésil': 'BRL',
    'Australie': 'AUD',
    'Hong Kong': 'HKD',
    'Singapour': 'SGD',
    'Suède': 'SEK',
    'Danemark': 'DKK',
    'Norvège': 'NOK',
    'France': 'EUR',
    'Allemagne': 'EUR',
    'Pays-Bas': 'EUR',
    'Italie': 'EUR',
    'Espagne': 'EUR',
    'Belgique': 'EUR',
    'Irlande': 'EUR',
    'Finlande': 'EUR',
    'Portugal': 'EUR',
    'Autriche': 'EUR',
    'Zone Euro': 'EUR',
    'Europe': 'EUR',
}

export function deviseDepuisPays(pays) {
    if (!pays) return 'EUR'
    return DEVISE_PAR_PAYS[pays] || 'EUR'
}
