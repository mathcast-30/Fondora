/**
 * Associe chaque position détenue à son dividende annuel par action (si connu dans le catalogue)
 * et calcule l'estimation de revenu annuel de dividendes pour cette position.
 *
 * @param {Array<{symbole: string, quantite: number, devise?: string}>} positions
 * @param {Object<string, {dividende_annuel_par_action: number|null, devise: string, dividende_updated_at: string|null}>} catalogueParTicker
 * @returns {Array} positions enrichies avec dividendePartAction, estimationAnnuelle, connu
 */
export function calculerEstimationParPosition(positions, catalogueParTicker) {
    return (positions || []).map((p) => {
        const entry = catalogueParTicker?.[p.symbole?.toUpperCase()]
        const dividendePartAction = Number(entry?.dividende_annuel_par_action) || 0
        const estimationAnnuelle = dividendePartAction * (Number(p.quantite) || 0)
        return {
            ...p,
            dividendePartAction,
            estimationAnnuelle,
            connu: !!entry?.dividende_annuel_par_action,
            derniereMaj: entry?.dividende_updated_at || null,
        }
    })
}

/**
 * Somme les estimations annuelles de toutes les positions.
 * @param {Array<{estimationAnnuelle: number}>} positionsEstimees
 * @returns {number}
 */
export function totalEstimationAnnuelle(positionsEstimees) {
    return (positionsEstimees || []).reduce((s, p) => s + (p.estimationAnnuelle || 0), 0)
}

/**
 * Estimation de revenu mensuel moyen (lissage simple annuel/12).
 * @param {number} totalAnnuel
 * @returns {number}
 */
export function estimationMensuelleMoyenne(totalAnnuel) {
    return (Number(totalAnnuel) || 0) / 12
}