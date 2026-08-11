import { useState, useMemo } from 'react'
import { X, HelpCircle, Loader2, BookOpen } from 'lucide-react'
import { useAidePage } from '../hooks/useAidePage'

function slugify(str) {
    return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')
}

export default function AideModal({ isOpen, onClose, route }) {
    const { aide, loading } = useAidePage(isOpen ? route : null)
    const [activeTerm, setActiveTerm] = useState(null)

    const termes = useMemo(() => (Array.isArray(aide?.glossaire) ? aide.glossaire : []), [aide])

    if (!isOpen) return null

    const scrollToTerm = (terme) => {
        const el = document.getElementById(`aide-terme-${slugify(terme)}`)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        setActiveTerm(terme)
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

                {!loading && aide && (
                    <div className="overflow-y-auto px-6 py-5 space-y-6">
                        {/* Vue d'ensemble */}
                        <div className="border-l-2 border-[var(--accent)] pl-4 py-0.5">
                            <p className="text-[var(--text-h)] text-[15px] leading-relaxed">
                                {aide.vue_ensemble}
                            </p>
                        </div>

                        {/* Navigation rapide des termes */}
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

                        {/* Glossaire */}
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
            </div>
        </div>
    )
}