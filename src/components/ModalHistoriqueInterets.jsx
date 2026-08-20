import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import Modal from './Modal'
import SecureValue from './SecureValue'
import { useInteretsLivret } from '../hooks/useInteretsLivret'
import { useProjectionInterets } from '../hooks/useProjectionInterets'
import { Sparkles } from 'lucide-react'

const formatMontantDefaut = (montant, devise = 'EUR') =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: devise }).format(montant)

const formatQuinzaine = (q) => {
    if (!q?.debut) return ''
    const [, mois] = q.debut.split('-')
    const jourDebut = q.debut.slice(-2)
    const jourFin = q.fin ? q.fin.slice(-2) : ''
    return `${jourDebut}-${jourFin}/${mois}`
}

function OngletHistorique({ compte, formatMontant }) {
    const { historique, totalPercu, loading } = useInteretsLivret(compte?.id)

    if (loading) return <p className="text-[var(--text)]">Chargement...</p>
    if (historique.length === 0) {
        return (
            <p className="text-[var(--text)] text-sm">
                Aucun intérêt versé pour l'instant. Les intérêts sont calculés automatiquement chaque 31 décembre.
            </p>
        )
    }
    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center bg-emerald/10 rounded-lg px-3 py-2">
                <span className="text-sm text-[var(--text)]">Total perçu depuis l'ouverture</span>
                <span className="font-bold text-emerald">
                    <SecureValue value={totalPercu} formatter={formatMontant} />
                </span>
            </div>
            <div className="divide-y divide-[var(--border)]">
                {historique.map((h) => (
                    <div key={h.id} className="flex justify-between items-center py-2.5">
                        <div>
                            <p className="font-medium text-[var(--text-h)]">{h.annee}</p>
                            {h.taux_moyen_pondere != null && (
                                <p className="text-xs text-[var(--text-muted)]">
                                    Taux moyen pondéré : {Number(h.taux_moyen_pondere).toFixed(3)} %
                                </p>
                            )}
                        </div>
                        <p className="font-semibold text-[var(--text-h)]">
                            <SecureValue value={Number(h.montant_interets)} formatter={formatMontant} />
                        </p>
                    </div>
                ))}
            </div>
        </div>
    )
}

function OngletProjection({ compte, formatMontant }) {
    const { projection, simulerVersement, loading, annee } = useProjectionInterets(compte)
    const [montantSimu, setMontantSimu] = useState('')
    const [dateSimu, setDateSimu] = useState(new Date().toISOString().slice(0, 10))
    const [resultatSimu, setResultatSimu] = useState(null)

    const handleSimuler = () => {
        const resultat = simulerVersement(montantSimu, dateSimu)
        setResultatSimu(resultat)
    }

    if (loading) return <p className="text-[var(--text)]">Chargement...</p>
    if (!projection) {
        return <p className="text-[var(--text)] text-sm">Pas de taux connu pour ce compte pour l'instant.</p>
    }

    const donneesGraphique = (projection.detailQuinzaines || []).filter((q) => q?.debut).map((q) => ({
        label: formatQuinzaine(q),
        interet: q.interet,
        soldeProductif: q.soldeProductif,
        taux: q.taux,
    }))

    return (
        <div className="space-y-5">
            <div className="bg-emerald/10 rounded-lg px-3 py-2.5">
                <p className="text-sm text-[var(--text)]">Projection {annee} (si le solde ne bouge plus d'ici le 31/12)</p>
                <p className="font-bold text-emerald text-lg">
                    <SecureValue value={projection.montantInterets} formatter={formatMontant} />
                </p>
                {projection.tauxMoyenPondere != null && (
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        Taux moyen pondéré sur l'année : {projection.tauxMoyenPondere.toFixed(3)} %
                    </p>
                )}
            </div>

            <div>
                <p className="text-xs text-[var(--text-muted)] mb-2">Accumulation par quinzaine</p>
                <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={donneesGraphique}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="label" tick={{ fontSize: 9 }} interval={1} stroke="var(--text-muted)" />
                            <YAxis tick={{ fontSize: 10 }} stroke="var(--text-muted)" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#161b2c', borderColor: '#334155', borderRadius: '12px' }}
                                labelStyle={{ color: '#94a3b8' }}
                                formatter={(value, name) => name === 'interet' ? [formatMontant(value), 'Intérêt'] : [value, name]}
                            />
                            <Bar dataKey="interet" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="border-t border-[var(--border)] pt-4">
                <p className="text-sm font-semibold text-[var(--text-h)] mb-2 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-emerald" /> Simuler un versement
                </p>
                <div className="flex gap-2 mb-2">
                    <input type="number" step="0.01" placeholder="Montant"
                        value={montantSimu} onChange={(e) => setMontantSimu(e.target.value)}
                        className="flex-1 border border-[var(--border)] bg-surface text-[var(--text-h)] rounded-lg px-3 py-2 text-sm" />
                    <input type="date" value={dateSimu} onChange={(e) => setDateSimu(e.target.value)}
                        className="border border-[var(--border)] bg-surface text-[var(--text-h)] rounded-lg px-3 py-2 text-sm" />
                    <button onClick={handleSimuler} className="bg-emerald hover:bg-emerald-light text-white font-semibold px-4 rounded-lg text-sm transition">
                        Simuler
                    </button>
                </div>
                {resultatSimu && (
                    <div className="bg-surface rounded-lg p-3 text-sm space-y-1">
                        <p className="text-[var(--text)]">
                            Cet argent commence à porter intérêt à partir du{' '}
                            <span className="font-semibold text-[var(--text-h)]">
                                {new Date(resultatSimu.dateValeur).toLocaleDateString('fr-FR')}
                            </span>
                        </p>
                        <p className="text-[var(--text)]">
                            Supplément d'intérêts d'ici le 31/12 :{' '}
                            <span className="font-bold text-emerald">
                                +{formatMontant(resultatSimu.interetSupplementaire)}
                            </span>
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                            Astuce : verser avant le 15 ou le 16 du mois change la date à partir de laquelle l'argent rapporte.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function ModalHistoriqueInterets({ compte, onClose }) {
    const [onglet, setOnglet] = useState('projection')

    const formatMontant = (montant) =>
        new Intl.NumberFormat('fr-FR', { style: 'currency', currency: compte?.devise || 'EUR' }).format(montant)

    return (
        <Modal isOpen={!!compte} onClose={onClose} title={`Intérêts — ${compte?.nom || ''}`}>
            <div className="flex gap-1 bg-surface p-1 rounded-xl mb-4 text-sm">
                <button onClick={() => setOnglet('projection')}
                    className={`flex-1 py-1.5 rounded-lg font-semibold transition ${onglet === 'projection' ? 'bg-emerald text-white' : 'text-[var(--text-muted)]'}`}>
                    Projection {new Date().getFullYear()}
                </button>
                <button onClick={() => setOnglet('historique')}
                    className={`flex-1 py-1.5 rounded-lg font-semibold transition ${onglet === 'historique' ? 'bg-emerald text-white' : 'text-[var(--text-muted)]'}`}>
                    Historique
                </button>
            </div>

            {onglet === 'projection'
                ? <OngletProjection compte={compte} formatMontant={formatMontant} />
                : <OngletHistorique compte={compte} formatMontant={formatMontant} />}
        </Modal>
    )
}