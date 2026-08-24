import { useState, useMemo, useEffect } from 'react'
import { X, HelpCircle, Loader2, BookOpen, Compass, PlayCircle, ChevronRight } from 'lucide-react'
import { useAidePage } from '../hooks/useAidePage'
import AideTour from './AideTour'

function slugify(str) {
    return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')
}

export default function AideModal({ isOpen, onClose, route, autoStart = false }) {
    const { aide, loading } = useAidePage(isOpen ? route : null)
    const [activeTerm, setActiveTerm] = useState(null)
    const [ongletActif, setOngletActif] = useState('concepts') // 'concepts' | 'mode_emploi'
    const [tourEnCours, setTourEnCours] = useState(false)
    const [indexDepart, setIndexDepart] = useState(0)
    const [autoStartConsomme, setAutoStartConsomme] = useState(false)

    // Réinitialise le déclencheur d'auto-start à chaque nouvelle ouverture
    useEffect(() => {
        if (isOpen) {
            setAutoStartConsomme(false)
        } else {
            setTourEnCours(false)
        }
    }, [isOpen])

    // Dès que les étapes sont chargées, si on nous a demandé un démarrage auto
    // (via le bandeau de découverte), on lance directement la visite guidée.
    useEffect(() => {
        const etapesDispo = Array.isArray(aide?.mode_emploi) ? aide.mode_emploi.length > 0 : false
        if (isOpen && autoStart && !autoStartConsomme && etapesDispo) {
            setOngletActif('mode_emploi')
            setIndexDepart(0)
            setTourEnCours(true)
            setAutoStartConsomme(true)
        }
    }, [isOpen, autoStart, autoStartConsomme, aide])

    const termes = useMemo(() => (Array.isArray(aide?.glossaire) ? aide.glossaire : []), [aide])
    const etapes = useMemo(() => {
        const raw = Array.isArray(aide?.mode_emploi) ? aide.mode_emploi : []
        return [...raw].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0))
    }, [aide])

    if (!isOpen) return null

    const scrollToTerm = (terme) => {
        const el = document.getElementById(`aide-terme-${slugify(terme)}`)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        setActiveTerm(terme)
    }

    const demarrerVisite = (depuisIndex = 0) => {
        setIndexDepart(depuisIndex)
        setTourEnCours(true)
    }

    // Pendant la visite guidée, on masque la carte de la modal pour laisser voir la page
    // en dessous ; seul l'overlay de surbrillance (AideTour) reste affiché.
    if (tourEnCours && etapes.length > 0) {
        return (
            <AideTour
                steps={etapes}
                startIndex={indexDepart}
                onClose={() => setTourEnCours(false)}
            />
        )
    }

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4 py-8"
            onClick={onClose}
        >
            <div
                className="bg-card rounded-2xl w-full max-w-3xl max-h-[85vh] shadow-2xl border border-[var(--border-strong)] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* En-tête */}
                <div className="px-6 py-5 border-b border-[var(--border)] flex items-start justify-between shrink-0 bg-[linear-gradient(180deg,rgba(16,185,129,0.06),transparent)]">
                    <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[var(--accent-bg)] border border-[var(--accent-border)] flex items-center justify-center shrink-0 mt-0.5">
                            <HelpCircle size={18} className="text-[var(--accent)]" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-0.5">
                                Guide de la page
                            </p>
                            <h2 className="text-[var(--text-h)] text-xl font-bold leading-tight">
                                {aide?.titre || '...'}
                            </h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-h)] transition-colors mt-1">
                        <X size={20} />
                    </button>
                </div>

                {/* Onglets */}
                {!loading && aide && (
                    <div className="px-6 pt-4 shrink-0 flex gap-2 border-b border-[var(--border)]">
                        <button
                            onClick={() => setOngletActif('concepts')}
                            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-t-lg -mb-px border-b-2 transition-colors ${
                                ongletActif === 'concepts'
                                    ? 'border-[var(--accent)] text-[var(--text-h)]'
                                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
                            }`}
                        >
                            <BookOpen size={13} /> Concepts financiers
                        </button>
                        <button
                            onClick={() => setOngletActif('mode_emploi')}
                            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-t-lg -mb-px border-b-2 transition-colors ${
                                ongletActif === 'mode_emploi'
                                    ? 'border-[var(--accent)] text-[var(--text-h)]'
                                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
                            }`}
                        >
                            <Compass size={13} /> Mode d'emploi
                        </button>
                    </div>
                )}

                {loading && (
                    <div className="flex items-center justify-center py-16 text-[var(--text-muted)]">
                        <Loader2 size={22} className="animate-spin" />
                    </div>
                )}

                {!loading && !aide && (
                    <p className="text-sm text-[var(--text-muted)] px-6 py-10 text-center">
                        Pas encore d'explication disponible pour cette page.
                    </p>
                )}

                {/* Onglet Concepts financiers */}
                {!loading && aide && ongletActif === 'concepts' && (
                    <div className="overflow-y-auto px-6 py-5 space-y-6">
                        <div className="border-l-2 border-[var(--accent)] pl-4 py-0.5">
                            <p className="text-[var(--text-h)] text-[15px] leading-relaxed">
                                {aide.vue_ensemble}
                            </p>
                        </div>

                        {termes.length > 1 && (
                            <div className="flex flex-wrap gap-1.5">
                                {termes.map((item) => (
                                    <button
                                        key={item.terme}
                                        onClick={() => scrollToTerm(item.terme)}
                                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${activeTerm === item.terme
                                                ? 'bg-[var(--accent-bg)] border-[var(--accent-border)] text-[var(--accent-light)]'
                                                : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-strong)]'
                                            }`}
                                    >
                                        {item.terme}
                                    </button>
                                ))}
                            </div>
                        )}

                        {termes.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <BookOpen size={13} className="text-[var(--text-muted)]" />
                                    <h3 className="text-[11px] uppercase tracking-widest font-bold text-[var(--text-muted)]">
                                        Ce que ça veut dire
                                    </h3>
                                </div>
                                <div className="space-y-3">
                                    {termes.map((item) => (
                                        <div
                                            key={item.terme}
                                            id={`aide-terme-${slugify(item.terme)}`}
                                            className="rounded-xl border border-[var(--border)] overflow-hidden scroll-mt-4 bg-white/[0.015]"
                                        >
                                            <div className="px-4 py-2.5 border-b border-[var(--border)] bg-white/[0.02]">
                                                <h4 className="font-semibold text-[var(--text-h)] text-sm">
                                                    {item.terme}
                                                </h4>
                                            </div>
                                            <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border)]">
                                                <div className="p-4">
                                                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--accent-2)' }}>
                                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--accent-2)' }} />
                                                        En clair
                                                    </span>
                                                    <p className="text-[13px] text-[var(--text)] leading-relaxed">
                                                        {item.notion}
                                                    </p>
                                                </div>
                                                <div className="p-4">
                                                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--accent-light)] mb-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                                                        Dans Fondora
                                                    </span>
                                                    <p className="text-[13px] text-[var(--text)] leading-relaxed">
                                                        {item.dans_fondora}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Onglet Mode d'emploi */}
                {!loading && aide && ongletActif === 'mode_emploi' && (
                    <div className="overflow-y-auto px-6 py-5 space-y-5">
                        {etapes.length === 0 ? (
                            <p className="text-sm text-[var(--text-muted)] text-center py-10">
                                Le mode d'emploi de cette page arrive bientôt.
                            </p>
                        ) : (
                            <>
                                <div className="flex items-center justify-between border-l-2 border-[var(--accent)] pl-4 py-0.5">
                                    <p className="text-[var(--text-h)] text-[15px] leading-relaxed">
                                        Une visite guidée pour repérer chaque élément de cette page, étape par étape.
                                    </p>
                                </div>

                                <button
                                    onClick={() => demarrerVisite(0)}
                                    className="w-full inline-flex items-center justify-center gap-2 text-sm font-bold bg-[var(--accent)] text-white py-3 rounded-xl hover:brightness-110 transition-all"
                                >
                                    <PlayCircle size={16} /> Démarrer la visite guidée
                                </button>

                                <div className="space-y-2">
                                    {etapes.map((etape, i) => (
                                        <button
                                            key={`${etape.titre}-${i}`}
                                            onClick={() => demarrerVisite(i)}
                                            className="w-full flex items-center gap-3 text-left rounded-xl border border-[var(--border)] p-3.5 hover:border-[var(--border-strong)] hover:bg-white/[0.02] transition-colors"
                                        >
                                            <span className="w-6 h-6 rounded-full bg-[var(--accent-bg)] border border-[var(--accent-border)] text-[var(--accent-light)] text-[11px] font-bold flex items-center justify-center shrink-0">
                                                {i + 1}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[13px] font-semibold text-[var(--text-h)] truncate">
                                                    {etape.titre}
                                                </p>
                                                <p className="text-[12px] text-[var(--text-muted)] truncate">
                                                    {etape.description}
                                                </p>
                                            </div>
                                            <ChevronRight size={14} className="text-[var(--text-muted)] shrink-0" />
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
