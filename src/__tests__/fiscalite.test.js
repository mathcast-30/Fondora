import { describe, it, expect } from 'vitest'
import {
    calculerImpotPEA,
    calculerImpotCTO,
    calculerImpotCrypto,
    calculerImpotAV,
    calculerScoreEfficaciteFiscale,
} from '../utils/fiscalite'

describe('Fiscalité - Calculs d\'impôts latents et efficacité', () => {
    describe('PEA', () => {
        it('applique PFU (31.4%) si détenu depuis moins de 5 ans', () => {
            // Ouvert il y a 2 ans
            const dateOuverture = new Date(Date.now() - 2 * 365.25 * 24 * 3600 * 1000).toISOString()
            const res = calculerImpotPEA(15000, 10000, dateOuverture)

            expect(res.plusValueBrute).toBe(5000)
            expect(res.apres5ans).toBe(false)
            expect(res.impotLatent).toBeCloseTo(5000 * 0.314)
            expect(res.netInPocket).toBeCloseTo(15000 - (5000 * 0.314))
        })

        it('applique uniquement les prélèvements sociaux (18.6%) après 5 ans', () => {
            // Ouvert il y a 6 ans
            const dateOuverture = new Date(Date.now() - 6 * 365.25 * 24 * 3600 * 1000).toISOString()
            const res = calculerImpotPEA(20000, 10000, dateOuverture)

            expect(res.plusValueBrute).toBe(10000)
            expect(res.apres5ans).toBe(true)
            expect(res.impotLatent).toBeCloseTo(10000 * 0.186)
            expect(res.netInPocket).toBeCloseTo(20000 - (10000 * 0.186))
        })

        it('ne génère aucun impôt en cas de moins-value', () => {
            const dateOuverture = new Date(Date.now() - 6 * 365.25 * 24 * 3600 * 1000).toISOString()
            const res = calculerImpotPEA(8000, 10000, dateOuverture)

            expect(res.plusValueBrute).toBe(0)
            expect(res.impotLatent).toBe(0)
            expect(res.netInPocket).toBe(8000)
        })
    })

    describe('CTO & Crypto', () => {
        it('CTO applique le taux PFU global (31.4%)', () => {
            const res = calculerImpotCTO(12000, 10000)
            expect(res.plusValueBrute).toBe(2000)
            expect(res.impotLatent).toBeCloseTo(2000 * 0.314)
            expect(res.netInPocket).toBeCloseTo(12000 - (2000 * 0.314))
        })

        it('Crypto applique le taux forfaitaire 30%', () => {
            const res = calculerImpotCrypto(5000, 2000)
            expect(res.plusValueBrute).toBe(3000)
            expect(res.impotLatent).toBeCloseTo(3000 * 0.30)
            expect(res.netInPocket).toBeCloseTo(5000 - 900)
        })
    })

    describe('Assurance Vie', () => {
        it('applique PFU avant 8 ans (30% : 12.8% IR + 17.2% PS)', () => {
            const dateOuverture = new Date(Date.now() - 3 * 365.25 * 24 * 3600 * 1000).toISOString()
            const res = calculerImpotAV(15000, 10000, dateOuverture, 'celibataire', 10000)

            expect(res.apres8ans).toBe(false)
            expect(res.gainBrut).toBe(5000)
            expect(res.impotLatent).toBeCloseTo(5000 * 0.30)
        })

        it('applique abattement célibataire (4 600 €) après 8 ans', () => {
            const dateOuverture = new Date(Date.now() - 9 * 365.25 * 24 * 3600 * 1000).toISOString()
            // Gain brut = 6 000 €, abattement = 4 600 €, taxable IR = 1 400 € à 7.5%
            // PS sur totalité du gain = 6 000 € * 17.2%
            const res = calculerImpotAV(16000, 10000, dateOuverture, 'celibataire', 10000)

            expect(res.apres8ans).toBe(true)
            expect(res.gainBrut).toBe(6000)
            const expectedIR = (6000 - 4600) * 0.075
            const expectedPS = 6000 * 0.172
            expect(res.impotIR).toBeCloseTo(expectedIR)
            expect(res.impotPS).toBeCloseTo(expectedPS)
            expect(res.impotLatent).toBeCloseTo(expectedIR + expectedPS)
        })

        it('applique abattement couple marié (9 200 €) après 8 ans', () => {
            const dateOuverture = new Date(Date.now() - 10 * 365.25 * 24 * 3600 * 1000).toISOString()
            // Gain brut = 8 000 € < 9 200 € => IR = 0, seuls les PS s'appliquent
            const res = calculerImpotAV(18000, 10000, dateOuverture, 'marie', 10000)

            expect(res.gainBrut).toBe(8000)
            expect(res.impotIR).toBe(0)
            expect(res.impotPS).toBeCloseTo(8000 * 0.172)
            expect(res.impotLatent).toBeCloseTo(8000 * 0.172)
        })
    })

    describe('Score efficacité fiscale', () => {
        it('retourne 100 si aucune plus-value', () => {
            const score = calculerScoreEfficaciteFiscale([])
            expect(score).toBe(100)
        })

        it('retourne un score élevé pour enveloppes optimisées (PEA après 5 ans)', () => {
            const enveloppes = [
                { plusValueBrute: 10000, impotLatent: 10000 * 0.186 },
            ]
            const score = calculerScoreEfficaciteFiscale(enveloppes)
            // (1 - 0.186 / 0.314) * 100 = ~41
            expect(score).toBeGreaterThan(40)
        })

        it('retourne 0 si imposition maximale sur CTO', () => {
            const enveloppes = [
                { plusValueBrute: 10000, impotLatent: 10000 * 0.314 },
            ]
            const score = calculerScoreEfficaciteFiscale(enveloppes)
            expect(score).toBe(0)
        })
    })
})
