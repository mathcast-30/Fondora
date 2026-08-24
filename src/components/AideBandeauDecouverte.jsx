import { X, Compass } from 'lucide-react'
import { useAidePage } from '../hooks/useAidePage'
import { usePagesTourVues } from '../hooks/usePagesTourVues'

export default function AideBandeauDecouverte({ route, onVoir }) {
    const { aide, loading } = useAidePage(route)
    const { dejaVue, marquerPageVue } = usePagesTourVues()

    const etapes = Array.isArray(aide?.mode_emploi) ? aide.mode_emploi : []

    if (loading || dejaVue(route) || etapes.length === 0) return null

    const handleVoir = () => {
        marquerPageVue(route)
        onVoir()
    }

    const handleIgnorer = () => {
        marquerPageVue(route)
    }

    return (
        <div className="w-full max-w-7xl mx-auto mb-4 flex items-center gap-3 rounded-xl border border-[var(--accent-border)] bg-[var(--accent-bg)] px-4 py-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/15 flex items-center justify-center shrink-0">
                <Compass size={16} className="text-[var(--accent-light)]" />
            </div>
            <p className="flex-1 text-[13px] text-[var(--text-h)]">
                <span className="font-semibold">Nouveau ici ?</span>{' '}
                <span className="text-[var(--text)]">Découvrez comment fonctionne cette page en 2 minutes.</span>
            </p>
            <button
                onClick={handleVoir}
                className="shrink-0 text-xs font-bold bg-[var(--accent)] text-white px-3.5 py-1.5 rounded-lg hover:brightness-110 transition-all"
            >
                Voir le mode d'emploi
            </button>
            <button
                onClick={handleIgnorer}
                className="shrink-0 text-[var(--text-muted)] hover:text-[var(--text-h)] transition-colors"
                title="Plus tard"
            >
                <X size={16} />
            </button>
        </div>
    )
}
