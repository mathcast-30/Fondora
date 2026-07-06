/**
 * Hook : useAssurancesVie
 * Étape 11.1 — Module Assurance Vie | Fondora
 *
 * Responsabilités :
 *  - Charger tous les contrats AV de l'utilisateur
 *  - Charger versements, dernière valorisation Fonds Euros et positions UC
 *  - Valoriser les UC via asset_prices_cache (jamais via Finnhub direct)
 *  - Exposer les mutations CRUD (ajout/suppression de contrat, versement, valorisation, position UC)
 *  - Calculer en mémoire les métriques dérivées (valeur, performance, XIRR, frais)
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
    calculerVersementsTotaux,
    calculerValeurActuelleContrat,
    calculerPerformanceAV,
    calculerXIRR_AV,
    calculerFraisAV,
} from '../lib/financialCalculations'

// ─── Helpers internes ─────────────────────────────────────────────────────────

/**
 * Calcule le TER moyen pondéré des UC d'un contrat.
 * La pondération se fait sur la valorisation de chaque UC (nb_parts × prix).
 * Si aucune UC n'a de prix, renvoie 0.
 *
 * @param {Array<{isin: string, nb_parts: number, frais_ter_produit?: number}>} positionsUC
 * @param {Object<string, {dernier_prix: number|null}>} prixCache
 * @returns {number} TER moyen pondéré en %
 */
function calculerTerMoyenPondere(positionsUC, prixCache) {
    if (!positionsUC || positionsUC.length === 0) return 0

    let totalValeur = 0
    let totalTerPondere = 0

    for (const pos of positionsUC) {
        const prix = prixCache?.[pos.isin]?.dernier_prix
        if (prix != null && prix > 0) {
            const valeurUC = Number(pos.nb_parts) * Number(prix)
            const ter = Number(pos.frais_ter_produit) || 0
            totalValeur += valeurUC
            totalTerPondere += valeurUC * ter
        }
    }

    return totalValeur > 0 ? totalTerPondere / totalValeur : 0
}

// ─── Hook principal ───────────────────────────────────────────────────────────

export function useAssurancesVie() {
    const { user } = useAuth()

    // État brut Supabase
    const [contrats, setContrats] = useState([])
    const [versementsParContrat, setVersementsParContrat] = useState({})
    const [valorisationsParContrat, setValorisationsParContrat] = useState({})
    const [positionsParContrat, setPositionsParContrat] = useState({})
    const [prixCache, setPrixCache] = useState({})

    // État UI
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // ── Chargement principal ─────────────────────────────────────────────────

    const charger = useCallback(async () => {
        if (!user) return

        setLoading(true)
        setError(null)

        try {
            // 1. Contrats
            const { data: contratsData, error: errContrats } = await supabase
                .from('assurances_vie')
                .select('*')
                .eq('user_id', user.id)
                .order('date_ouverture', { ascending: true })

            if (errContrats) throw errContrats
            const contratsListe = contratsData || []
            setContrats(contratsListe)

            if (contratsListe.length === 0) {
                setLoading(false)
                return
            }

            const contratIds = contratsListe.map((c) => c.id)

            // 2. Versements — tous les contrats en une seule requête
            const { data: versementsData, error: errVers } = await supabase
                .from('assurances_vie_versements')
                .select('*')
                .in('contrat_id', contratIds)
                .order('date', { ascending: true })

            if (errVers) throw errVers

            // 3. Dernières valorisations Fonds Euros — via la vue utilitaire
            const { data: valorisationsData, error: errVal } = await supabase
                .from('av_valorisation_actuelle')
                .select('*')
                .in('contrat_id', contratIds)

            if (errVal) throw errVal

            // 4. Positions UC avec les métadonnées du catalogue
            const { data: positionsData, error: errPos } = await supabase
                .from('assurances_vie_positions')
                .select(`
                    *,
                    catalogue_actifs (
                        id,
                        nom,
                        isin,
                        frais_ter_produit
                    )
                `)
                .in('contrat_id', contratIds)

            if (errPos) throw errPos

            // 5. Prix de marché des UC via asset_prices_cache
            //    On construit la liste des ISINs uniques depuis les positions
            const isinsUC = [...new Set((positionsData || []).map((p) => p.isin))]
            let prixCacheData = {}

            if (isinsUC.length > 0) {
                const { data: prixData, error: errPrix } = await supabase
                    .from('asset_prices_cache')
                    .select('isin, dernier_prix, updated_at')
                    .in('isin', isinsUC)

                if (errPrix) throw errPrix

                // Transformation en map isin → { dernier_prix, updated_at }
                prixCacheData = (prixData || []).reduce((acc, row) => {
                    acc[row.isin] = { dernier_prix: row.dernier_prix, updated_at: row.updated_at }
                    return acc
                }, {})
            }

            // ── Indexation par contrat_id ──────────────────────────────────

            const versementsMap = {}
            const valorisationsMap = {}
            const positionsMap = {}

            for (const contrat of contratsListe) {
                versementsMap[contrat.id] = (versementsData || []).filter(
                    (v) => v.contrat_id === contrat.id
                )
                valorisationsMap[contrat.id] =
                    (valorisationsData || []).find((v) => v.contrat_id === contrat.id) || null

                positionsMap[contrat.id] = (positionsData || [])
                    .filter((p) => p.contrat_id === contrat.id)
                    .map((p) => ({
                        ...p,
                        // Aplatir les métadonnées du catalogue dans la position
                        nom_actif: p.catalogue_actifs?.nom,
                        frais_ter_produit: p.catalogue_actifs?.frais_ter_produit ?? 0,
                    }))
            }

            setVersementsParContrat(versementsMap)
            setValorisationsParContrat(valorisationsMap)
            setPositionsParContrat(positionsMap)
            setPrixCache(prixCacheData)
        } catch (err) {
            console.error('[useAssurancesVie] Erreur de chargement:', err)
            setError(err.message || 'Erreur de chargement des contrats AV')
        } finally {
            setLoading(false)
        }
    }, [user])

    useEffect(() => {
        charger()
    }, [charger])

    // ── Métriques calculées par contrat ──────────────────────────────────────

    /**
     * Retourne les métriques calculées pour un contrat donné.
     * Fonction pure — ne fait aucun appel réseau.
     */
    const metriquesContrat = useCallback(
        (contratId) => {
            const contrat = contrats.find((c) => c.id === contratId)
            if (!contrat) return null

            const versements = versementsParContrat[contratId] || []
            const valorisation = valorisationsParContrat[contratId]
            const positionsUC = positionsParContrat[contratId] || []

            const versementsTotaux = calculerVersementsTotaux(versements)
            const valeurFondsEuros = Number(valorisation?.valeur_fonds_euros) || 0

            const { total: valeurActuelle, ucDisponibles } = calculerValeurActuelleContrat(
                valeurFondsEuros,
                positionsUC,
                prixCache
            )

            const { euros: perfEuros, pourcentage: perfPct } = calculerPerformanceAV(
                valeurActuelle,
                versementsTotaux
            )

            const xirr = calculerXIRR_AV(versements, valeurActuelle)

            const fraisTerMoyen = calculerTerMoyenPondere(positionsUC, prixCache)
            const { fraisTotalPct, fraisAnnuelsEuros, alerteFreisEleves } = calculerFraisAV(
                contrat.frais_gestion_enveloppe,
                fraisTerMoyen,
                valeurActuelle
            )

            return {
                contrat,
                versements,
                valorisation,
                positionsUC,
                versementsTotaux,
                valeurFondsEuros,
                valeurActuelle,
                ucDisponibles,
                perfEuros,
                perfPct,
                xirr,
                fraisTerMoyen,
                fraisTotalPct,
                fraisAnnuelsEuros,
                alerteFreisEleves,
                derniereDateValorisation: valorisation?.derniere_date_valorisation || null,
            }
        },
        [contrats, versementsParContrat, valorisationsParContrat, positionsParContrat, prixCache]
    )

    // ── MUTATIONS ─────────────────────────────────────────────────────────────

    /**
     * Ajoute un nouveau contrat AV.
     * @param {{ nom, assureur, date_ouverture, frais_gestion_enveloppe }} payload
     */
    const ajouterContrat = useCallback(
        async (payload) => {
            const { error: err } = await supabase.from('assurances_vie').insert({
                ...payload,
                user_id: user.id,
            })
            if (err) throw err
            await charger()
        },
        [user, charger]
    )

    /**
     * Supprime un contrat AV et toutes ses données liées (cascade SQL).
     * @param {string} contratId
     */
    const supprimerContrat = useCallback(
        async (contratId) => {
            const { error: err } = await supabase
                .from('assurances_vie')
                .delete()
                .eq('id', contratId)
                .eq('user_id', user.id)
            if (err) throw err
            await charger()
        },
        [user, charger]
    )

    /**
     * Ajoute un versement sur un contrat.
     * @param {string} contratId
     * @param {{ date: string, montant: number }} payload
     */
    const ajouterVersement = useCallback(
        async (contratId, payload) => {
            const { error: err } = await supabase.from('assurances_vie_versements').insert({
                contrat_id: contratId,
                user_id: user.id,
                date: payload.date,
                montant: payload.montant,
            })
            if (err) throw err
            await charger()
        },
        [user, charger]
    )

    /**
     * Upsert la valorisation Fonds Euros du jour.
     * Utilise la contrainte UNIQUE(contrat_id, date) pour éviter les doublons.
     * @param {string} contratId
     * @param {{ date: string, valeur: number }} payload
     */
    const upsertValorisation = useCallback(
        async (contratId, payload) => {
            const { error: err } = await supabase
                .from('assurances_vie_valorisations')
                .upsert(
                    {
                        contrat_id: contratId,
                        user_id: user.id,
                        date: payload.date,
                        valeur: payload.valeur,
                    },
                    { onConflict: 'contrat_id,date' }
                )
            if (err) throw err
            await charger()
        },
        [user, charger]
    )

    /**
     * Upsert une position UC sur un contrat.
     * Si asset_id existe déjà sur ce contrat, met à jour nb_parts.
     * @param {string} contratId
     * @param {{ asset_id: string, isin: string, nb_parts: number }} payload
     */
    const upsertPositionUC = useCallback(
        async (contratId, payload) => {
            const { error: err } = await supabase
                .from('assurances_vie_positions')
                .upsert(
                    {
                        contrat_id: contratId,
                        user_id: user.id,
                        asset_id: payload.asset_id,
                        isin: payload.isin,
                        nb_parts: payload.nb_parts,
                    },
                    { onConflict: 'contrat_id,asset_id' }
                )
            if (err) throw err
            await charger()
        },
        [user, charger]
    )

    /**
     * Supprime une position UC d'un contrat.
     * @param {string} positionId - id de la ligne dans assurances_vie_positions
     */
    const supprimerPositionUC = useCallback(
        async (positionId) => {
            const { error: err } = await supabase
                .from('assurances_vie_positions')
                .delete()
                .eq('id', positionId)
                .eq('user_id', user.id)
            if (err) throw err
            await charger()
        },
        [user, charger]
    )

    // ── Valeur totale du patrimoine AV (tous contrats) ───────────────────────

    const valeurTotaleAV = contrats.reduce((acc, contrat) => {
        const m = metriquesContrat(contrat.id)
        return acc + (m?.valeurActuelle || 0)
    }, 0)

    return {
        // Données brutes
        contrats,
        versementsParContrat,
        valorisationsParContrat,
        positionsParContrat,
        prixCache,

        // État UI
        loading,
        error,
        charger,

        // Métriques calculées
        metriquesContrat,
        valeurTotaleAV,

        // Mutations
        ajouterContrat,
        supprimerContrat,
        ajouterVersement,
        upsertValorisation,
        upsertPositionUC,
        supprimerPositionUC,
    }
}
