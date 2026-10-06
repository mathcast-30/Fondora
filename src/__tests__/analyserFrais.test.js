import { describe, it, expect } from 'vitest'
import { analyserFraisGlobaux, calculerTrajectoireFrais } from '../utils/analyserFrais'

describe('analyserFrais - Calculs de frais et simulations', () => {
    describe('analyserFraisGlobaux', () => {
        it('calcule correctement les frais d\'enveloppe et positions', () => {
            const comptes = [
                { id: 'c1', frais_gestion_enveloppe: 0.5 }, // 0.5%
            ]
            const positions = [
                { compte_id: 'c1', symbole: 'CW8', quantite: 10, prix_achat_moyen: 400 },
            ]
            const prixBourse = new Map([['CW8', 500]]) // Valeur = 10 * 500 = 5000 €

            const res = analyserFraisGlobaux({ comptes, positions, prixBourse })

            expect(res.capitalInvesti).toBe(5000)
            expect(res.totalFraisEnveloppeAnnuels).toBe(5000 * 0.005) // 25 €
            expect(res.totalFraisAnnuels).toBe(25)
            expect(res.tauxFraisMoyen).toBeCloseTo(0.005)
            expect(res.valorisationsApproximatives).toBe(false)
        })

        it('utilise le PRU lorsque le cours de bourse est absent', () => {
            const comptes = [{ id: 'c1', frais_gestion_enveloppe: 1 }]
            const positions = [{ compte_id: 'c1', symbole: 'INCONNU', quantite: 2, prix_achat_moyen: 150 }]

            const res = analyserFraisGlobaux({ comptes, positions, prixBourse: new Map() })

            expect(res.capitalInvesti).toBe(300) // 2 * 150
            expect(res.valorisationsApproximatives).toBe(true)
        })

        it('intègre les assurances vie (frais enveloppe + TER des UC)', () => {
            const avDetail = [
                {
                    contrat: { frais_gestion_enveloppe: 0.6 },
                    positionsUC: [
                        { isin: 'FR001', nb_parts: 10, frais_ter_produit: 0.2 },
                    ],
                    valeurFondsEuros: 4000,
                },
            ]
            const prixUC = { FR001: { dernier_prix: 100 } } // UC = 10 * 100 = 1000 €, total AV = 5000 €

            const res = analyserFraisGlobaux({ avDetail, prixUC })

            expect(res.capitalInvesti).toBe(5000)
            expect(res.totalFraisEnveloppeAnnuels).toBeCloseTo(5000 * 0.006) // 30 €
            expect(res.totalFraisAnnuels).toBeGreaterThan(30)
        })
    })

    describe('calculerTrajectoireFrais', () => {
        it('génère un tableau de 30 années avec impact des frais', () => {
            const trajectoire = calculerTrajectoireFrais({
                capitalInvesti: 100000,
                tauxFraisMoyen: 0.015, // 1.5% de frais
                rendementBrut: 0.07,   // 7% brut, donc 5.5% net
                horizon: 30,
            })

            expect(trajectoire.length).toBe(30)
            const annee1 = trajectoire[0]
            expect(annee1.capitalBrut).toBe(107000)
            expect(annee1.capitalNet).toBe(105500)
            expect(annee1.siphonne).toBe(1500)

            const annee30 = trajectoire[29]
            expect(annee30.siphonne).toBeGreaterThan(0)
            expect(annee30.capitalBrut).toBeGreaterThan(annee30.capitalNet)
        })

        it('gère correctement un capital de 0 avec fallback', () => {
            const trajectoire = calculerTrajectoireFrais({
                capitalInvesti: 0,
                tauxFraisMoyen: 0,
            })
            expect(trajectoire.length).toBe(30)
            expect(trajectoire[0].capitalBrut).toBe(10700) // Fallback à 10 000
        })
    })
})
