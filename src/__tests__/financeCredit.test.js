import { describe, it, expect } from 'vitest'
import { calculerCRDaDate } from '../utils/financeCredit'

describe('financeCredit - calculerCRDaDate', () => {
    it('retourne le capital emprunté si la date cible est avant la date de début', () => {
        const dette = {
            capitalEmprunte: 100000,
            tauxInteret: 2.5,
            dureeMois: 240,
            mensualite: 529.90,
            dateDebut: new Date('2026-01-01').toISOString()
        }
        const dateCible = new Date('2025-12-01')
        const crd = calculerCRDaDate({ ...dette, dateCible })
        
        expect(crd).toBe(100000)
    })

    it('retourne 0 si la dette est totalement remboursée (date cible après la fin)', () => {
        const dette = {
            capitalEmprunte: 100000,
            tauxInteret: 2.5,
            dureeMois: 120, // 10 ans
            mensualite: 942.70,
            dateDebut: new Date('2020-01-01').toISOString()
        }
        const dateCible = new Date('2031-01-01') // 11 ans plus tard
        const crd = calculerCRDaDate({ ...dette, dateCible })
        
        expect(crd).toBe(0)
    })

    it('gère correctement un taux de 0% (pas de division par zéro)', () => {
        const dette = {
            capitalEmprunte: 10000,
            tauxInteret: 0,
            dureeMois: 10,
            mensualite: 1000,
            dateDebut: new Date('2020-01-01').toISOString()
        }
        const dateCible = new Date('2020-06-01') // 5 mois écoulés
        const crd = calculerCRDaDate({ ...dette, dateCible })
        
        // 10000 - (5 * 1000) = 5000
        expect(crd).toBeCloseTo(5000)
    })

    it('ne plante pas si dureeMois = 0', () => {
        const dette = {
            capitalEmprunte: 10000,
            tauxInteret: 5,
            dureeMois: 0,
            mensualite: 0,
            dateDebut: new Date('2020-01-01').toISOString()
        }
        const dateCible = new Date('2021-01-01')
        const crd = calculerCRDaDate({ ...dette, dateCible })
        
        // Un crédit de 0 mois est instantanément terminé ou absurde
        expect(crd).toBe(0)
    })
})
