// Données de référence : patrimoine net médian par tranche d'âge en France
// Source : INSEE/Banque de France, enquête Patrimoine (valeurs de référence, mises à jour périodiquement)
export const PATRIMOINE_MEDIAN_FRANCE = [
    { trancheAge: 'Moins de 30 ans', min: 0, max: 29, median: 10000 },
    { trancheAge: '30 à 39 ans', min: 30, max: 39, median: 60000 },
    { trancheAge: '40 à 49 ans', min: 40, max: 49, median: 130000 },
    { trancheAge: '50 à 59 ans', min: 50, max: 59, median: 190000 },
    { trancheAge: '60 à 69 ans', min: 60, max: 69, median: 220000 },
    { trancheAge: '70 ans et plus', min: 70, max: 120, median: 200000 },
]

export function getTrancheParAge(age) {
    return PATRIMOINE_MEDIAN_FRANCE.find((t) => age >= t.min && age <= t.max) || PATRIMOINE_MEDIAN_FRANCE[0]
}