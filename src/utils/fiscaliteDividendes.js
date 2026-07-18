import { FISCALITE_2026 } from './fiscalite';

/**
 * Calcule la fiscalité applicable à un dividende perçu, selon l'enveloppe.
 *
 * Règles 2026 :
 *  - CTO : PFU 31,4 % (12,8 % IR + 18,6 % PS) — cohérent avec calculerImpotCTO.
 *  - PEA : les dividendes sont capitalisés en franchise d'impôt tant qu'ils
 *          restent dans le plan. Seule la fiscalité de sortie (calculerImpotPEA)
 *          s'applique lors d'un retrait — pas ici.
 *
 * @param {number} montantBrut
 * @param {'PEA'|'CTO'} typeCompte
 * @returns {{
 *   montantBrut: number,
 *   impotRevenu: number,
 *   prelevementsSociaux: number,
 *   impotTotal: number,
 *   montantNet: number,
 *   regimeFiscal: 'PEA_DIFFERE'|'PFU_CTO',
 *   tauxEffectif: number,
 * }}
 */
export function calculerFiscaliteDividende(montantBrut, typeCompte = 'CTO') {
    const brut = Number(montantBrut) || 0;

    if (typeCompte === 'PEA') {
        return {
            montantBrut: brut,
            impotRevenu: 0,
            prelevementsSociaux: 0,
            impotTotal: 0,
            montantNet: brut,
            regimeFiscal: 'PEA_DIFFERE',
            tauxEffectif: 0,
        };
    }

    // CTO : PFU global (12,8 % IR + 18,6 % PS)
    const impotRevenu = brut * FISCALITE_2026.PFU_IR;
    const prelevementsSociaux = brut * FISCALITE_2026.PS_FINANCIER;
    const impotTotal = impotRevenu + prelevementsSociaux;
    const montantNet = brut - impotTotal;

    return {
        montantBrut: brut,
        impotRevenu,
        prelevementsSociaux,
        impotTotal,
        montantNet,
        regimeFiscal: 'PFU_CTO',
        tauxEffectif: FISCALITE_2026.PFU_GLOBAL,
    };
}

/**
 * Agrège une liste de dividendes (avec type_compte + reinvesti) en une synthèse :
 * brut/net global, impôt total, réparti réinvesti vs perçu, et ventilation par enveloppe.
 *
 * @param {Array<{montant:number, type_compte:string, reinvesti:boolean}>} dividendes
 * @returns {{
 *   totalBrut: number,
 *   totalNet: number,
 *   totalImpot: number,
 *   totalReinvesti: number,
 *   totalPercu: number,
 *   parEnveloppe: { PEA: {brut:number, net:number}, CTO: {brut:number, net:number} },
 * }}
 */
export function calculerSyntheseDividendes(dividendes) {
    const synth = {
        totalBrut: 0,
        totalNet: 0,
        totalImpot: 0,
        totalReinvesti: 0,
        totalPercu: 0,
        parEnveloppe: {
            PEA: { brut: 0, net: 0 },
            CTO: { brut: 0, net: 0 },
        },
    };

    for (const d of dividendes || []) {
        const typeCompte = d.type_compte === 'PEA' ? 'PEA' : 'CTO';
        const fiscal = calculerFiscaliteDividende(d.montant, typeCompte);

        synth.totalBrut += fiscal.montantBrut;
        synth.totalNet += fiscal.montantNet;
        synth.totalImpot += fiscal.impotTotal;

        if (d.reinvesti) {
            synth.totalReinvesti += fiscal.montantNet;
        } else {
            synth.totalPercu += fiscal.montantNet;
        }

        synth.parEnveloppe[typeCompte].brut += fiscal.montantBrut;
        synth.parEnveloppe[typeCompte].net += fiscal.montantNet;
    }

    return synth;
}