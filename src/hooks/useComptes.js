import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useEntiteFiltre } from '../context/EntiteContext'

export function useComptes() {
    const { user } = useAuth()
    const { entiteFiltre } = useEntiteFiltre()
    const [comptes, setComptes] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const chargerComptes = useCallback(async () => {
        setLoading(true)
        let query = supabase.from('comptes').select('*').order('ordre', { ascending: true }).order('created_at', { ascending: true })
        if (entiteFiltre) query = query.eq('entite_id', entiteFiltre)
        const { data: comptesData, error: comptesError } = await query

        if (comptesError) {
            setError(comptesError.message)
            setLoading(false)
            return
        }

        const { data: txData, error: txError } = await supabase
            .from('transactions')
            .select('compte_id, type, montant')

        if (txError) {
            setError(txError.message)
            setLoading(false)
            return
        }

        const { data: positionsData } = await supabase
            .from('positions_financieres')
            .select('compte_id, symbole, quantite, prix_achat_moyen')
        const { data: prixData } = await supabase
            .from('asset_prices_cache')
            .select('symbole, prix_actuel')
        const prixParSymbole = new Map((prixData || []).map(p => [p.symbole, Number(p.prix_actuel)]))

        const comptesEnrichis = (comptesData || []).map(compte => {
            const txCompte = txData.filter(t => t.compte_id === compte.id)
            const totalRevenus = txCompte.filter(t => t.type === 'revenu').reduce((s, t) => s + Number(t.montant), 0)
            const totalDepenses = txCompte.filter(t => t.type === 'depense').reduce((s, t) => s + Number(t.montant), 0)
            const estInvestissement = ['pea', 'cto'].includes((compte.type || '').toLowerCase())
            const valeurPositions = estInvestissement
                ? (positionsData || []).filter(p => p.compte_id === compte.id).reduce((s, p) =>
                    s + Number(p.quantite) * (prixParSymbole.get(p.symbole) || Number(p.prix_achat_moyen)), 0)
                : 0

            return {
                ...compte,
                soldeReel: Number(compte.solde) + totalRevenus - totalDepenses + valeurPositions,
                liquidites: Number(compte.solde) + totalRevenus - totalDepenses,
                valeurPositions,
                totalRevenus,
                totalDepenses
            }
        })

        setComptes(comptesEnrichis)
        setError(null)
        setLoading(false)
    }, [entiteFiltre])

    useEffect(() => {
        if (user) chargerComptes()
    }, [user, chargerComptes])

    const ajouterCompte = async (compte) => {
        const { data, error } = await supabase
            .from('comptes')
            .insert({ ...compte, user_id: user.id })
            .select()
            .single()

        if (!error) await chargerComptes()
        return { error, data }
    }

    const modifierCompte = async (id, updates) => {
        const { error } = await supabase
            .from('comptes')
            .update(updates)
            .eq('id', id)

        if (!error) await chargerComptes()
        return { error }
    }

    // Clôture douce avec gestion du solde : si le compte n'est pas vide, crée les
    // transactions nécessaires pour le vider proprement (virement ou sortie de l'app)
    // avant de le masquer. Réversible via reactiverCompte (mais pas les transferts).
    const cloturerCompte = async (compte, destinationId = null) => {
        const solde = Number(compte.soldeReel ?? compte.solde)

        if (Math.abs(solde) > 0.01) {
            const sens = solde > 0 ? 'depense' : 'revenu'
            const { data: sortie, error: errSortie } = await supabase.from('transactions').insert({
                user_id: user.id,
                compte_id: compte.id,
                montant: Math.abs(solde),
                type: sens,
                date: new Date().toISOString().slice(0, 10),
                description: destinationId ? `Virement de clôture vers un autre compte` : 'Retrait de clôture (hors app)',
                source: 'cloture_compte',
            }).select('id').single()
            if (errSortie) return { error: errSortie }

            if (destinationId) {
                const { data: entree, error: errEntree } = await supabase.from('transactions').insert({
                    user_id: user.id,
                    compte_id: destinationId,
                    montant: Math.abs(solde),
                    type: solde > 0 ? 'revenu' : 'depense',
                    date: new Date().toISOString().slice(0, 10),
                    description: `Virement depuis "${compte.nom}" (clôturé)`,
                    source: 'cloture_compte',
                    transaction_liee_id: sortie.id,
                }).select('id').single()
                if (errEntree) return { error: errEntree }

                // Lien bidirectionnel, pour retrouver l'entrée depuis la sortie aussi
                await supabase.from('transactions').update({ transaction_liee_id: entree.id }).eq('id', sortie.id)
            }
        }

        const { error } = await supabase
            .from('comptes')
            .update({ statut: 'cloture', date_cloture: new Date().toISOString().slice(0, 10) })
            .eq('id', compte.id)

        if (!error) await chargerComptes()
        return { error }
    }

    // Vérifie si ce compte a un transfert de clôture lié, pour proposer son annulation
    // avant de réactiver (sinon le compte réactivé se retrouve avec un solde faussé).
    const getTransfertClotureLie = async (compteId) => {
        const { data } = await supabase
            .from('transactions')
            .select('id, montant, type, transaction_liee_id, transaction_liee:transaction_liee_id(compte_id, comptes(nom))')
            .eq('compte_id', compteId)
            .eq('source', 'cloture_compte')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
        return data || null
    }

    // Réactive le compte. Si annulerTransfert=true et qu'un transfert de clôture existe,
    // supprime les deux transactions liées (remet l'argent "comme avant").
    const reactiverCompte = async (id, annulerTransfert = false) => {
        if (annulerTransfert) {
            const transfert = await getTransfertClotureLie(id)
            if (transfert) {
                const idsASupprimer = [transfert.id, transfert.transaction_liee_id].filter(Boolean)
                const { error: errSuppr } = await supabase.from('transactions').delete().in('id', idsASupprimer)
                if (errSuppr) return { error: errSuppr }
            }
        }

        const { error } = await supabase
            .from('comptes')
            .update({ statut: 'actif', date_cloture: null })
            .eq('id', id)

        if (!error) await chargerComptes()
        return { error }
    }

    // Suppression irréversible - perd tout l'historique lié (cascade DB). À réserver
    // aux comptes vides sans historique, ou après confirmation explicite renforcée.
    const supprimerDefinitivement = async (id) => {
        const { error } = await supabase
            .from('comptes')
            .delete()
            .eq('id', id)

        if (!error) await chargerComptes()
        return { error }
    }

    // Réordonne une liste de comptes (typiquement ceux d'une même catégorie) selon
    // l'ordre des ids fourni. Ne touche pas aux comptes des autres catégories.
    const reordonnerComptes = async (idsOrdonnes) => {
        await Promise.all(
            idsOrdonnes.map((id, index) =>
                supabase.from('comptes').update({ ordre: index }).eq('id', id)
            )
        )
        await chargerComptes()
    }

    return {
        comptes, loading, error,
        ajouterCompte, modifierCompte, supprimerDefinitivement, reordonnerComptes,
        cloturerCompte, reactiverCompte, getTransfertClotureLie, chargerComptes
    }
}