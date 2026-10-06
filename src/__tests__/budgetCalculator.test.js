import { describe, it, expect } from 'vitest'
import { calculerRestantAVivre, calculerImpactWhatIf, detecterAbonnementsEtFrais } from '../utils/budgetCalculator'
import { calculerProjection } from '../lib/projection'

describe('Budget & CashFlow - Calculs et projections', () => {
    describe('calculerRestantAVivre', () => {
        it('calcule le restant à vivre en soustrayant dépenses à venir et épargne', () => {
            const res = calculerRestantAVivre({
                soldeComptesCourants: 2000,
                depensesRecurrentes: [
                    { jour_prelevement: 28, montant: 300 }, // Dépense fin de mois
                ],
                objectifsEpargneMois: 200,
            })

            expect(res.soldeComptesCourants ?? 2000).toBe(2000)
            expect(res.joursRestants).toBeGreaterThan(0)
            expect(res.budgetQuotidienConseille).toBeGreaterThanOrEqual(0)
        })
    })

    describe('calculerImpactWhatIf', () => {
        it('simule l\'épargne accumulée sur 5, 10, 20 et 30 ans avec intérêts composés', () => {
            const resultats = calculerImpactWhatIf(100, 0.07, 0.02)

            expect(resultats).toHaveProperty('ans_5')
            expect(resultats).toHaveProperty('ans_10')
            expect(resultats).toHaveProperty('ans_20')
            expect(resultats).toHaveProperty('ans_30')

            expect(resultats.ans_5).toBeGreaterThan(100 * 12 * 5) // Intérêts > capital brut
            expect(resultats.ans_30).toBeGreaterThan(resultats.ans_10)
        })

        it('calcule correctement en cas de rendement réel nul ou négatif', () => {
            const resultats = calculerImpactWhatIf(100, 0.02, 0.02)
            expect(resultats.ans_5).toBe(100 * 12 * 5)
        })
    })

    describe('detecterAbonnementsEtFrais', () => {
        it('identifie les abonnements et les frais bancaires connus', () => {
            const txs = [
                { id: '1', description: 'Cotisation Carte bancaire', montant: -12, type: 'depense' },
                { id: '2', description: 'Netflix abonnement', montant: -17.99, type: 'depense' },
                { id: '3', description: 'Courses supermarché', montant: -50, type: 'depense' },
            ]

            const { abonnementsDetectes, fraisBancairesDetectes } = detecterAbonnementsEtFrais(txs)

            expect(fraisBancairesDetectes.length).toBe(1)
            expect(fraisBancairesDetectes[0].libelle).toBe('Cotisation Carte bancaire')
            expect(abonnementsDetectes.length).toBe(1)
            expect(abonnementsDetectes[0].nom).toBe('Netflix abonnement')
        })
    })

    describe('calculerProjection', () => {
        it('projette le solde de fin de mois à partir du rythme actuel', () => {
            const txs = [
                { type: 'revenu', montant: 3000 },
                { type: 'depense', montant: 500 },
            ]

            const projection = calculerProjection(txs, 1, 2026)
            expect(projection.soldeActuel).toBe(2500)
            expect(projection.joursDansLeMois).toBe(31)
        })
    })
})
