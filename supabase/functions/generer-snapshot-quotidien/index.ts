import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

// ─── Portage de la formule analytique CRD (utils/lib/calculImmo.js) ─────────
function calculCapitalRestantDu(montant: number, tauxAnnuel: number, dureeMois: number, moisEcoules: number) {
    if (!montant || !tauxAnnuel || !dureeMois || moisEcoules <= 0) return montant || 0
    if (moisEcoules >= dureeMois) return 0
    const tauxMensuel = tauxAnnuel / 100 / 12
    if (tauxMensuel === 0) return Math.max(0, montant - (montant / dureeMois) * moisEcoules)
    const mensualite = (montant * tauxMensuel * Math.pow(1 + tauxMensuel, dureeMois)) /
        (Math.pow(1 + tauxMensuel, dureeMois) - 1)
    const capitalRestant = montant * Math.pow(1 + tauxMensuel, moisEcoules) -
        mensualite * (Math.pow(1 + tauxMensuel, moisEcoules) - 1) / tauxMensuel
    return Math.max(0, capitalRestant)
}

function moisEcoulesDepuis(dateDebut: string): number {
    const debut = new Date(dateDebut)
    const maintenant = new Date()
    return (maintenant.getFullYear() - debut.getFullYear()) * 12 + (maintenant.getMonth() - debut.getMonth())
}

serve(async (req) => {
    try {
        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
        const aujourdHui = new Date().toISOString().split('T')[0]

        const { data: profils, error: errProfils } = await supabase
            .from('profiles')
            .select('id')
            .eq('onboarding_completed', true)

        if (errProfils) throw errProfils

        const resultats: Array<{ user_id: string; ok: boolean; erreur?: string }> = []

        for (const profil of profils || []) {
            const userId = profil.id
            try {
                // ── 1. Cash : comptes actifs + transactions ──────────────────
                const { data: comptes } = await supabase
                    .from('comptes')
                    .select('id, solde, statut')
                    .eq('user_id', userId)

                const comptesActifs = (comptes || []).filter(c => (c.statut ?? 'actif') === 'actif')

                const { data: transactions } = await supabase
                    .from('transactions')
                    .select('compte_id, type, montant')
                    .eq('user_id', userId)

                const totalCash = comptesActifs.reduce((acc, c) => {
                    const txCompte = (transactions || []).filter(t => t.compte_id === c.id)
                    const revenus = txCompte.filter(t => t.type === 'revenu').reduce((s, t) => s + Number(t.montant), 0)
                    const depenses = txCompte.filter(t => t.type === 'depense').reduce((s, t) => s + Number(t.montant), 0)
                    return acc + Number(c.solde) + revenus - depenses
                }, 0)

                // ── 2. Bourse : positions actions/ETF via cache de prix ───────
                const { data: positionsBourse } = await supabase
                    .from('positions_financieres')
                    .select('symbole, quantite, prix_achat_moyen')
                    .eq('user_id', userId)

                let totalBourse = 0
                if (positionsBourse && positionsBourse.length > 0) {
                    const symboles = [...new Set(positionsBourse.map(p => p.symbole?.toUpperCase()).filter(Boolean))]
                    const { data: prixCache } = await supabase
                        .from('asset_prices_cache')
                        .select('ticker, dernier_prix')
                        .in('ticker', symboles)

                    const prixMap: Record<string, number> = {}
                    for (const p of prixCache || []) {
                        if (p.ticker) prixMap[p.ticker] = Number(p.dernier_prix)
                    }

                    totalBourse = positionsBourse.reduce((acc, p) => {
                        const prix = prixMap[p.symbole?.toUpperCase()] ?? Number(p.prix_achat_moyen)
                        return acc + prix * Number(p.quantite)
                    }, 0)
                }

                // ── 3. Crypto : positions crypto via CoinGecko ─────────────
                const { data: positionsCrypto } = await supabase
                    .from('positions_crypto')
                    .select('coin_id, quantite, prix_achat_moyen')
                    .eq('user_id', userId)

                let totalCrypto = 0
                if (positionsCrypto && positionsCrypto.length > 0) {
                    const coinIds = [...new Set(positionsCrypto.map(p => p.coin_id).filter(Boolean))]
                    let coursMap: Record<string, number> = {}
                    try {
                        const res = await fetch(
                            `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds.join(',')}&vs_currencies=eur`
                        )
                        const data = await res.json()
                        for (const id of coinIds) {
                            if (data[id]?.eur) coursMap[id] = data[id].eur
                        }
                    } catch (_) {
                        // silencieux : on retombera sur prix_achat_moyen
                    }

                    totalCrypto = positionsCrypto.reduce((acc, p) => {
                        const prix = coursMap[p.coin_id] ?? Number(p.prix_achat_moyen)
                        return acc + prix * Number(p.quantite)
                    }, 0)
                }

                // ── 4. Assurance Vie : fonds euros + UC via cache de prix ─────
                const { data: contratsAV } = await supabase
                    .from('assurances_vie')
                    .select('id')
                    .eq('user_id', userId)

                let totalAV = 0
                if (contratsAV && contratsAV.length > 0) {
                    const contratIds = contratsAV.map(c => c.id)

                    const { data: valorisations } = await supabase
                        .from('av_valorisation_actuelle')
                        .select('contrat_id, valeur_fonds_euros')
                        .in('contrat_id', contratIds)

                    const { data: positionsUC } = await supabase
                        .from('assurances_vie_positions')
                        .select('contrat_id, isin, nb_parts')
                        .in('contrat_id', contratIds)

                    const totalFondsEuros = (valorisations || []).reduce(
                        (s, v) => s + Number(v.valeur_fonds_euros || 0), 0
                    )

                    let totalUC = 0
                    if (positionsUC && positionsUC.length > 0) {
                        const isins = [...new Set(positionsUC.map(p => p.isin).filter(Boolean))]
                        const { data: prixUC } = await supabase
                            .from('asset_prices_cache')
                            .select('isin, dernier_prix')
                            .in('isin', isins)

                        const prixUCMap: Record<string, number> = {}
                        for (const p of prixUC || []) {
                            if (p.isin) prixUCMap[p.isin] = Number(p.dernier_prix)
                        }

                        totalUC = positionsUC.reduce((acc, p) => {
                            const prix = prixUCMap[p.isin] ?? 0
                            return acc + prix * Number(p.nb_parts)
                        }, 0)
                    }

                    totalAV = totalFondsEuros + totalUC
                }

                // ── 5. Immobilier net (valeur - CRD lié) ───────────────
                const { data: biens } = await supabase
                    .from('biens_immobiliers')
                    .select('id, valeur_actuelle')
                    .eq('user_id', userId)

                const { data: dettesImmo } = await supabase
                    .from('dettes')
                    .select('bien_immobilier_id, capital_emprunte, taux_interet, duree_mois, date_debut')
                    .eq('user_id', userId)
                    .eq('type', 'Immobilier')

                const totalImmoNet = (biens || []).reduce((acc, b) => {
                    const dette = (dettesImmo || []).find(d => d.bien_immobilier_id === b.id)
                    let crd = 0
                    if (dette) {
                        const mois = moisEcoulesDepuis(dette.date_debut)
                        crd = calculCapitalRestantDu(
                            Number(dette.capital_emprunte),
                            Number(dette.taux_interet),
                            Number(dette.duree_mois),
                            mois
                        )
                    }
                    return acc + (Number(b.valeur_actuelle) - crd)
                }, 0)

                // ── 6. Actifs tangibles (si la table existe) ───────────
                let totalTangible = 0
                try {
                    const { data: tangibles } = await supabase
                        .from('actifs_tangibles')
                        .select('valeur_estimee')
                        .eq('user_id', userId)
                    totalTangible = (tangibles || []).reduce((s, t) => s + Number(t.valeur_estimee || 0), 0)
                } catch (_) {
                    totalTangible = 0
                }

                // ── 7. Dettes totales (toutes, CRD actuel) ─────────────
                const { data: toutesLesDettes } = await supabase
                    .from('dettes')
                    .select('capital_emprunte, taux_interet, duree_mois, date_debut')
                    .eq('user_id', userId)

                const totalDettes = (toutesLesDettes || []).reduce((acc, d) => {
                    const mois = moisEcoulesDepuis(d.date_debut)
                    return acc + calculCapitalRestantDu(
                        Number(d.capital_emprunte),
                        Number(d.taux_interet),
                        Number(d.duree_mois),
                        mois
                    )
                }, 0)

                // ── 8. Upsert du snapshot du jour ─────────────────
                const { error: errUpsert } = await supabase
                    .from('snapshot_patrimoine')
                    .upsert({
                        user_id: userId,
                        date: aujourdHui,
                        total_cash: totalCash,
                        total_bourse: totalBourse,
                        total_crypto: totalCrypto,
                        total_assurance_vie: totalAV,
                        total_immo_net: totalImmoNet,
                        total_tangible: totalTangible,
                        total_dettes: totalDettes,
                    }, { onConflict: 'user_id,date' })

                if (errUpsert) throw errUpsert
                resultats.push({ user_id: userId, ok: true })

            } catch (errUser) {
                resultats.push({ user_id: userId, ok: false, erreur: errUser.message })
            }
        }

        return new Response(JSON.stringify({
            success: true,
            date: aujourdHui,
            nbUtilisateurs: resultats.length,
            resultats,
        }), { headers: { 'Content-Type': 'application/json' } })

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
})