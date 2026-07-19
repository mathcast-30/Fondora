/**
 * Tests unitaires Vitest — Fonctions de calcul Assurance Vie
 * Étape 11.1 | Fondora
 *
 * Couverture :
 *   - calculerVersementsTotaux
 *   - calculerValeurActuelleContrat
 *   - calculerPerformanceAV
 *   - calculerXIRR_AV
 *   - calculerFraisAV
 *   - calculerManqueAGagner
 *   - calculerFiscaliteAV  (< 8 ans, ≥ 8 ans célibataire, ≥ 8 ans marié, rachat partiel)
 *   - genererDonneesGraphiqueFrais
 */

import { describe, it, expect } from 'vitest'
import {
    calculerVersementsTotaux,
    calculerValeurActuelleContrat,
    calculerPerformanceAV,
    calculerXIRR_AV,
    calculerFraisAV,
    calculerManqueAGagner,
    calculerFiscaliteAV,
    genererDonneesGraphiqueFrais,
} from '../financialCalculations.js'

// ============================================================
// calculerVersementsTotaux
// ============================================================
describe('calculerVersementsTotaux', () => {
    it('renvoie 0 pour un tableau vide', () => {
        expect(calculerVersementsTotaux([])).toBe(0)
    })

    it('renvoie 0 pour undefined', () => {
        expect(calculerVersementsTotaux(undefined)).toBe(0)
    })

    it('renvoie le montant exact pour un seul versement', () => {
        expect(calculerVersementsTotaux([{ montant: 5000 }])).toBe(5000)
    })

    it('additionne correctement plusieurs versements', () => {
        const versements = [
            { montant: 5000 },
            { montant: 1500 },
            { montant: 750.50 },
        ]
        expect(calculerVersementsTotaux(versements)).toBeCloseTo(7250.50, 2)
    })

    it('convertit les chaînes en nombres', () => {
        expect(calculerVersementsTotaux([{ montant: '3000' }])).toBe(3000)
    })
})

// ============================================================
// calculerValeurActuelleContrat
// ============================================================
describe('calculerValeurActuelleContrat', () => {
    it(`renvoie la valeur fonds euros si pas d'UC`, () => {
        const { total, ucDisponibles } = calculerValeurActuelleContrat(10000, [], {})
        expect(total).toBe(10000)
        expect(ucDisponibles).toBe(true)
    })

    it('additionne fonds euros + valorisation UC connue', () => {
        const positionsUC = [{ isin: 'FR0010315770', nb_parts: 100 }]
        const prixCache = { FR0010315770: { dernier_prix: 25.50 } }
        const { total } = calculerValeurActuelleContrat(5000, positionsUC, prixCache)
        expect(total).toBeCloseTo(5000 + 100 * 25.50, 2)
    })

    it('exclut les UC sans prix et passe ucDisponibles à false', () => {
        const positionsUC = [
            { isin: 'FR0010315770', nb_parts: 100 },
            { isin: 'LU0000001234', nb_parts: 50 },
        ]
        const prixCache = {
            FR0010315770: { dernier_prix: 25.50 },
            LU0000001234: { dernier_prix: null },  // Prix indisponible
        }
        const { total, ucDisponibles } = calculerValeurActuelleContrat(5000, positionsUC, prixCache)
        expect(total).toBeCloseTo(5000 + 100 * 25.50, 2)
        expect(ucDisponibles).toBe(false)
    })

    it('gère un prixCache absent pour un ISIN', () => {
        const positionsUC = [{ isin: 'FR0010315770', nb_parts: 100 }]
        const { total, ucDisponibles } = calculerValeurActuelleContrat(5000, positionsUC, {})
        expect(total).toBe(5000)
        expect(ucDisponibles).toBe(false)
    })
})

// ============================================================
// calculerPerformanceAV
// ============================================================
describe('calculerPerformanceAV', () => {
    it('renvoie 0 si pas de versements', () => {
        const { euros, pourcentage } = calculerPerformanceAV(10000, 0)
        expect(euros).toBe(0)
        expect(pourcentage).toBe(0)
    })

    it('calcule une performance positive', () => {
        const { euros, pourcentage } = calculerPerformanceAV(12000, 10000)
        expect(euros).toBeCloseTo(2000, 2)
        expect(pourcentage).toBeCloseTo(20, 2)
    })

    it('calcule une performance négative', () => {
        const { euros, pourcentage } = calculerPerformanceAV(8000, 10000)
        expect(euros).toBeCloseTo(-2000, 2)
        expect(pourcentage).toBeCloseTo(-20, 2)
    })

    it('calcule une performance nulle', () => {
        const { euros, pourcentage } = calculerPerformanceAV(10000, 10000)
        expect(euros).toBe(0)
        expect(pourcentage).toBe(0)
    })
})

// ============================================================
// calculerXIRR_AV
// ============================================================
describe('calculerXIRR_AV', () => {
    it('renvoie null sans versements', () => {
        expect(calculerXIRR_AV([], 10000)).toBeNull()
    })

    it('renvoie null si valeurActuelle ≤ 0', () => {
        const versements = [{ date: '2020-01-01', montant: 10000 }]
        expect(calculerXIRR_AV(versements, 0)).toBeNull()
    })

    it('calcule un XIRR positif pour un contrat rentable', () => {
        // Versement de 10 000 € il y a 2 ans, valeur actuelle 11 236 € ≈ 6 %/an
        const dateVersement = new Date()
        dateVersement.setFullYear(dateVersement.getFullYear() - 2)
        const versements = [{
            date: dateVersement.toISOString().split('T')[0],
            montant: 10000,
        }]
        const dateEval = new Date()
        const xirr = calculerXIRR_AV(versements, 11236, dateEval)
        expect(xirr).not.toBeNull()
        expect(xirr).toBeGreaterThan(0.05)  // > 5 %
        expect(xirr).toBeLessThan(0.08)     // < 8 %
    })

    it('calcule un XIRR négatif pour un contrat en perte', () => {
        const dateVersement = new Date()
        dateVersement.setFullYear(dateVersement.getFullYear() - 2)
        const versements = [{
            date: dateVersement.toISOString().split('T')[0],
            montant: 10000,
        }]
        const xirr = calculerXIRR_AV(versements, 9000)
        expect(xirr).not.toBeNull()
        expect(xirr).toBeLessThan(0)
    })
})

// ============================================================
// calculerFraisAV
// ============================================================
describe('calculerFraisAV', () => {
    it('calcule les frais cumulés (enveloppe + TER)', () => {
        const { fraisTotalPct, fraisAnnuelsEuros } = calculerFraisAV(0.60, 0.20, 50000)
        expect(fraisTotalPct).toBeCloseTo(0.80, 2)
        expect(fraisAnnuelsEuros).toBeCloseTo(400, 2)
    })

    it(`ne génère pas d'alerte si fraisEnveloppe ≤ 1 %`, () => {
        const { alerteFreisEleves } = calculerFraisAV(0.60, 0.20, 50000)
        expect(alerteFreisEleves).toBe(false)
    })

    it('génère une alerte si fraisEnveloppe > 1 %', () => {
        const { alerteFreisEleves } = calculerFraisAV(1.50, 0.20, 50000)
        expect(alerteFreisEleves).toBe(true)
    })

    it('fonctionne sans UC (TER = 0)', () => {
        const { fraisTotalPct, fraisAnnuelsEuros } = calculerFraisAV(0.60, 0, 100000)
        expect(fraisTotalPct).toBeCloseTo(0.60, 2)
        expect(fraisAnnuelsEuros).toBeCloseTo(600, 2)
    })

    it('renvoie 0 si la valeur est 0', () => {
        const { fraisAnnuelsEuros } = calculerFraisAV(1.50, 0.20, 0)
        expect(fraisAnnuelsEuros).toBe(0)
    })
})

// ============================================================
// calculerManqueAGagner
// ============================================================
describe('calculerManqueAGagner', () => {
    it('renvoie 0 pour tous les horizons si frais = 0.5 % (référence)', () => {
        const { ans10, ans20, ans30 } = calculerManqueAGagner(50000, 0.5, 0)
        // Frais identiques à la référence → pas de manque à gagner
        expect(ans10).toBe(0)
        expect(ans20).toBe(0)
        expect(ans30).toBe(0)
    })

    it('manque à gagner croissant avec le temps (frais élevés)', () => {
        const { ans10, ans20, ans30 } = calculerManqueAGagner(50000, 1.50, 0)
        expect(ans10).toBeGreaterThan(0)
        expect(ans20).toBeGreaterThan(ans10)
        expect(ans30).toBeGreaterThan(ans20)
    })

    it('renvoie 30 points dans graphique', () => {
        const { graphique } = calculerManqueAGagner(50000, 1.50, 0.20)
        expect(graphique).toHaveLength(30)
        expect(graphique[0].annee).toBe(1)
        expect(graphique[29].annee).toBe(30)
    })

    it('chaque point graphique a capitalActuel < capitalOptimise si frais > 0.5 %', () => {
        const { graphique } = calculerManqueAGagner(50000, 1.50, 0)
        graphique.forEach(({ capitalActuel, capitalOptimise }) => {
            expect(capitalOptimise).toBeGreaterThan(capitalActuel)
        })
    })
})

// ============================================================
// calculerFiscaliteAV
// ============================================================
describe('calculerFiscaliteAV', () => {
    // Helpers pour créer des dates d'ouverture relatives
    const dateDepuisAns = (ans) => {
        const d = new Date()
        d.setFullYear(d.getFullYear() - ans)
        return d.toISOString().split('T')[0]
    }

    describe('Contrat < 8 ans — PFU 30 %', () => {
        it('applique le régime PFU', () => {
            const res = calculerFiscaliteAV(5000, 10000, 15000, dateDepuisAns(3), 'celibataire')
            expect(res.regimeFiscal).toBe('PFU')
        })

        it('calcule la quote-part correctement (rachat partiel)', () => {
            // Valeur = 15 000, versements = 10 000, gains = 5 000 (33,33 % de la valeur)
            // Retrait = 3 000 → quote-part = 3 000 × (5000/15000) = 1 000
            const res = calculerFiscaliteAV(3000, 10000, 15000, dateDepuisAns(3), 'celibataire')
            expect(res.quotePart).toBeCloseTo(1000, 0)
        })

        it('applique 12,8 % IR + 17,2 % PS sur la quote-part', () => {
            // Retrait = 3 000, quote-part = 1 000
            const res = calculerFiscaliteAV(3000, 10000, 15000, dateDepuisAns(3), 'celibataire')
            expect(res.impotRevenu).toBeCloseTo(1000 * 0.128, 2)
            expect(res.prelevementsSociaux).toBeCloseTo(1000 * 0.172, 2)
            expect(res.impotTotal).toBeCloseTo(1000 * 0.30, 2)
        })

        it(`pas d'abattement en PFU`, () => {
            const res = calculerFiscaliteAV(3000, 10000, 15000, dateDepuisAns(3), 'celibataire')
            expect(res.abattement).toBe(0)
        })

        it('indique les années restantes avant les 8 ans', () => {
            const res = calculerFiscaliteAV(3000, 10000, 15000, dateDepuisAns(3), 'celibataire')
            expect(res.anneesAvantOptimum).toBe(5)
        })
    })

    describe('Contrat ≥ 8 ans — Régime AV 8 ans, célibataire (abattement 4 600 €)', () => {
        it('applique le régime AV_8ANS', () => {
            const res = calculerFiscaliteAV(10000, 50000, 80000, dateDepuisAns(10), 'celibataire')
            expect(res.regimeFiscal).toBe('AV_8ANS')
        })

        it('abattement de 4 600 € pour un célibataire', () => {
            const res = calculerFiscaliteAV(10000, 50000, 80000, dateDepuisAns(10), 'celibataire')
            expect(res.abattement).toBe(4600)
        })

        it('applique 7,5 % IR sur la base imposable (gains − abattement)', () => {
            // Valeur = 80 000, versements = 50 000, gains = 30 000 (37,5 % de la valeur)
            // Retrait = 10 000 → quote-part = 10 000 × (30000/80000) = 3 750
            // Base imposable = 3 750 − 4 600 = 0 (abattement > gains → pas d'IR)
            const res = calculerFiscaliteAV(10000, 50000, 80000, dateDepuisAns(10), 'celibataire')
            expect(res.quotePart).toBeCloseTo(3750, 0)
            expect(res.baseImposable).toBe(0)
            expect(res.impotRevenu).toBe(0)
        })

        it('PS de 17,2 % sur toute la quote-part même si IR = 0 (abattement couvre)', () => {
            const res = calculerFiscaliteAV(10000, 50000, 80000, dateDepuisAns(10), 'celibataire')
            expect(res.prelevementsSociaux).toBeCloseTo(3750 * 0.172, 2)
        })

        it(`IR s'applique quand la quote-part dépasse l'abattement`, () => {
            // Retrait = 60 000 → quote-part = 60 000 × (30000/80000) = 22 500
            // Base imposable = 22 500 − 4 600 = 17 900
            const res = calculerFiscaliteAV(60000, 50000, 80000, dateDepuisAns(10), 'celibataire')
            expect(res.quotePart).toBeCloseTo(22500, 0)
            expect(res.baseImposable).toBeCloseTo(17900, 0)
            expect(res.impotRevenu).toBeCloseTo(17900 * 0.075, 2)
        })

        it('anneesAvantOptimum est null quand déjà ≥ 8 ans', () => {
            const res = calculerFiscaliteAV(10000, 50000, 80000, dateDepuisAns(10), 'celibataire')
            expect(res.anneesAvantOptimum).toBeNull()
        })
    })

    describe('Contrat ≥ 8 ans — Régime AV 8 ans, marié (abattement 9 200 €)', () => {
        it('abattement de 9 200 € pour un marié/pacsé', () => {
            const res = calculerFiscaliteAV(10000, 50000, 80000, dateDepuisAns(10), 'marie')
            expect(res.abattement).toBe(9200)
        })

        it('la quote-part est la même quel que soit le statut marital', () => {
            const cel = calculerFiscaliteAV(10000, 50000, 80000, dateDepuisAns(10), 'celibataire')
            const mar = calculerFiscaliteAV(10000, 50000, 80000, dateDepuisAns(10), 'marie')
            expect(cel.quotePart).toBeCloseTo(mar.quotePart, 2)
        })

        it('PS de 17,2 % (protégé AV 2026) — NON 18,6 % comme PEA/CTO', () => {
            const res = calculerFiscaliteAV(60000, 50000, 80000, dateDepuisAns(10), 'marie')
            // On vérifie que le taux PS utilisé est exactement 17,2 %
            const tauxPSInfere = res.prelevementsSociaux / res.quotePart
            expect(tauxPSInfere).toBeCloseTo(0.172, 3)
        })
    })

    describe('Cas limites', () => {
        it('pas de fiscalité si le contrat est en perte (gains ≤ 0)', () => {
            const res = calculerFiscaliteAV(5000, 15000, 10000, dateDepuisAns(3), 'celibataire')
            expect(res.gainsTotaux).toBe(0)
            expect(res.quotePart).toBe(0)
            expect(res.impotTotal).toBe(0)
        })

        it('pas de fiscalité si le montant de retrait est 0', () => {
            const res = calculerFiscaliteAV(0, 10000, 15000, dateDepuisAns(3), 'celibataire')
            expect(res.impotTotal).toBe(0)
        })
    })
})

// ============================================================
// genererDonneesGraphiqueFrais
// ============================================================
describe('genererDonneesGraphiqueFrais', () => {
    it('renvoie exactement 30 points de données', () => {
        const data = genererDonneesGraphiqueFrais(50000, 1.50, 0.20)
        expect(data).toHaveLength(30)
    })

    it('chaque point contient annee, capitalActuel, capitalOptimise, ecart', () => {
        const data = genererDonneesGraphiqueFrais(50000, 1.50, 0.20)
        const point = data[0]
        expect(point).toHaveProperty('annee')
        expect(point).toHaveProperty('capitalActuel')
        expect(point).toHaveProperty('capitalOptimise')
        expect(point).toHaveProperty('ecart')
    })

    it(`l'écart est toujours ≥ 0`, () => {
        const data = genererDonneesGraphiqueFrais(50000, 1.50, 0)
        data.forEach(({ ecart }) => {
            expect(ecart).toBeGreaterThanOrEqual(0)
        })
    })

    it(`l'écart est 0 quand fraisEnveloppe = 0.5 % (référence)`, () => {
        const data = genererDonneesGraphiqueFrais(50000, 0.5, 0)
        data.forEach(({ ecart }) => {
            expect(ecart).toBeCloseTo(0, 0)
        })
    })
})
