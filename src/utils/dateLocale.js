// Utilitaires de date locaux (fuseau du navigateur).
//
// `new Date().toISOString()` renvoie une date en UTC ; `.split('T')[0]` peut
// donc renvoyer la veille ou le lendemain selon le fuseau de l'utilisateur.
// Exemple : un utilisateur français (UTC+2) le 15/08 à 01:00 local obtient
// "14/08" en UTC. Ces helpers garantissent une date au format YYYY-MM-DD
// correspondant au jour calendaire perçu par l'utilisateur.

// Retourne la date du jour au format YYYY-MM-DD dans le fuseau local.
export function aujourdhuiLocale() {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const j = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${j}`
}

// Convertit n'importe quelle Date (ou chaîne ISO) en YYYY-MM-DD dans le fuseau
// local du navigateur. Évite le décalage UTC de toISOString().
export function toLocaleDate(dateInput) {
    const d = (dateInput instanceof Date) ? dateInput : new Date(dateInput)
    if (isNaN(d.getTime())) return null
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const j = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${j}`
}
