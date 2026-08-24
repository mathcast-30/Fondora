import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { Link } from 'react-router-dom'
import SecureValue from '../components/SecureValue'
import ComparaisonINSEE from '../components/ComparaisonINSEE'
import NetWorthChart from '../components/NetWorthChart'
import { useComptes } from '../hooks/useComptes'
import { usePositions } from '../hooks/usePositions'
import { useCoursBourse } from '../hooks/useCoursBourse'
import { usePositionsCrypto } from '../hooks/usePositionsCrypto'
import { useCoursCrypto } from '../hooks/useCoursCrypto'
import { useBiensImmobiliers } from '../hooks/useBiensImmobiliers'
import { useDettes } from '../hooks/useDettes'
import { Wallet } from 'lucide-react'
import { supabase } from '../lib/supabase'

function Patrimoine() {
    const { comptes } = useComptes()

    // Valorisation investissements
    const { positions } = usePositions()
    const { cours } = useCoursBourse(positions.map((p) => p.symbole))
    const { positions: positionsCrypto } = usePositionsCrypto()
    const { cours: coursCrypto } = useCoursCrypto(positionsCrypto.map((p) => p.coin_id))
    const { biens } = useBiensImmobiliers()
    const { kpis: kpisDettes } = useDettes()
    const totalDettes = kpisDettes.totalDettes || 0

    const totalComptes = comptes
        .filter(c => !['pea', 'cto'].includes((c.type || '').toLowerCase()) && (c.statut ?? 'actif') === 'actif')
        .reduce((acc, c) => acc + Number(c.soldeReel ?? c.solde), 0)
    const totalActions = positions.reduce((acc, p) => acc + (cours[p.symbole]?.coursActuel || p.prix_achat_moyen) * p.quantite, 0)
    const totalCrypto = positionsCrypto.reduce((acc, p) => acc + (coursCrypto[p.coin_id]?.eur || p.prix_achat_moyen) * p.quantite, 0)
    const valeurImmobilierBrute = biens.reduce((acc, bien) => acc + Number(bien.valeur_actuelle || 0), 0)
    const patrimoineTotal = totalComptes + totalActions + totalCrypto + valeurImmobilierBrute
    const patrimoineNet = patrimoineTotal - totalDettes

    const [prixBourse, setPrixBourse] = useState([])
    useEffect(() => {
        const symboles = [...new Set(positions.map(p => p.symbole).filter(Boolean))]
        if (!symboles.length) { setPrixBourse([]); return }
        supabase.from('asset_prices_cache').select('symbole, updated_at').in('symbole', symboles).then(({ data }) => setPrixBourse(data || []))
    }, [positions])
    const maintenant = Date.now()
    const bourseAncienne = prixBourse.filter(p => !p.updated_at || maintenant - new Date(p.updated_at).getTime() > 36 * 3600 * 1000)
    const immoAncien = biens.filter(b => maintenant - new Date(b.updated_at || b.created_at).getTime() > 180 * 24 * 3600 * 1000)
    const dernierCoursBourse = prixBourse.reduce((latest, p) => !latest || new Date(p.updated_at) > new Date(latest) ? p.updated_at : latest, null)

    const formatMontant = (m, devise = 'EUR') =>
        new Intl.NumberFormat('fr-FR', { style: 'currency', currency: devise }).format(m)

    return (
        <Layout>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                    <h1 className="text-[var(--text-h)] text-3xl font-bold mb-1">Patrimoine</h1>
                    <p className="text-[var(--text)]">Vue consolidée de tous tes actifs.</p>
                </div>
                <Link
                    to="/comptes"
                    className="bg-card border border-[var(--border)] hover:bg-[var(--bg-card-hover)] text-[var(--text-h)] font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition"
                >
                    <Wallet size={18} /> Gérer mes comptes
                </Link>
            </div>

            {/* Évolution du patrimoine */}
            <div data-aide-id="patrimoine-evolution-chart" className="bg-card rounded-xl p-5 border border-[var(--border)] mb-6">
                <h2 className="text-[var(--text-h)] font-bold text-lg mb-4">Évolution du patrimoine</h2>
                <NetWorthChart />
            </div>

            {(bourseAncienne.length > 0 || immoAncien.length > 0) && (
                <div data-aide-id="patrimoine-alerte-actualisation" className="bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded-xl p-4 mb-6 text-sm">
                    <strong>Valorisations à actualiser :</strong>{' '}
                    {bourseAncienne.length > 0 && `${bourseAncienne.length} cours boursier(s) de plus de 36 h. `}
                    {immoAncien.length > 0 && `${immoAncien.length} estimation(s) immobilière(s) de plus de 6 mois.`}
                </div>
            )}

            {/* Patrimoine total consolidé */}
            <div data-aide-id="patrimoine-total-consolide" className="bg-surface rounded-2xl p-6 mb-6 border border-[var(--border)]">
                <p className="text-[var(--text)] text-sm mb-1">Patrimoine brut total consolidé</p>
                <p className="text-[var(--text-h)] text-3xl font-bold mb-1"><SecureValue value={patrimoineTotal} formatter={formatMontant} /></p>
                <p className="text-sm mb-4" style={{ color: totalDettes > 0 ? '#FCA5A5' : '#6EE7B7' }}>
                    Patrimoine net : <strong><SecureValue value={patrimoineNet} formatter={formatMontant} /></strong>
                    {totalDettes > 0 && <span className="ml-2 text-xs opacity-75">(dettes : -<SecureValue value={totalDettes} formatter={formatMontant} />)</span>}
                </p>
                <div data-aide-id="patrimoine-repartition-actifs" className="grid grid-cols-4 gap-4">
                    <div>
                        <p className="text-[var(--text)] text-xs mb-1">Comptes bancaires</p>
                        <p className="text-[var(--text-h)] font-semibold"><SecureValue value={totalComptes} formatter={formatMontant} /></p>
                    </div>
                    <div>
                        <p className="text-[var(--text)] text-xs mb-1">Actions & ETF</p>
                        <p className="text-emerald font-semibold"><SecureValue value={totalActions} formatter={formatMontant} /></p>
                        <p className="text-[10px] text-[var(--text-muted)]">Cours : {dernierCoursBourse ? new Date(dernierCoursBourse).toLocaleString('fr-FR') : 'indisponible'}</p>
                    </div>
                    <div>
                        <p className="text-[var(--text)] text-xs mb-1">Crypto</p>
                        <p className="text-emerald font-semibold"><SecureValue value={totalCrypto} formatter={formatMontant} /></p>
                    </div>
                    <div>
                        <p className="text-[var(--text)] text-xs mb-1">Immobilier</p>
                        <p className="text-emerald font-semibold"><SecureValue value={valeurImmobilierBrute} formatter={formatMontant} /></p>
                        <p className="text-[10px] text-[var(--text-muted)]">Valeur brute ; dettes déduites une seule fois ci-dessous</p>
                    </div>
                    <div>
                        <p className="text-[var(--text)] text-xs mb-1">Dettes (CRD)</p>
                        <p className="font-semibold" style={{ color: '#FCA5A5' }}>-<SecureValue value={totalDettes} formatter={formatMontant} /></p>
                    </div>
                </div>
            </div>

            {/* Comparaison INSEE */}
            <div data-aide-id="patrimoine-comparaison-insee" className="mb-6">
                <ComparaisonINSEE patrimoineTotal={patrimoineTotal} />
            </div>
        </Layout>
    )
}

export default Patrimoine