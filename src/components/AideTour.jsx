import { useState, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight, MapPin } from 'lucide-react'

/**
 * Moteur de visite guidée 100% custom (sans lib externe).
 * Affiche un overlay sombre avec une "découpe" (spotlight) autour de l'élément
 * ciblé par step.cible (sélecteur CSS, généralement [data-aide-id="..."]),
 * accompagné d'un callout avec titre/description et navigation précédent/suivant.
 *
 * Props:
 *  - steps: [{ ordre, titre, description, cible }]
 *  - startIndex: index de départ dans le tableau steps
 *  - onClose: callback appelé à la fermeture (Échap, clic X, ou "Terminer")
 */
export default function AideTour({ steps, startIndex = 0, onClose }) {
    const [index, setIndex] = useState(startIndex)
    const [rect, setRect] = useState(null)
    const [notFound, setNotFound] = useState(false)

    const step = steps[index]
    const isLast = index === steps.length - 1

    const mesurer = useCallback(() => {
        if (!step) return
        const el = document.querySelector(step.cible)
        if (!el) {
            setNotFound(true)
            setRect(null)
            return
        }
        setNotFound(false)
        setRect(el.getBoundingClientRect())
    }, [step])

    // Localise + scroll vers l'élément à chaque changement d'étape
    useEffect(() => {
        if (!step) return
        setRect(null)
        setNotFound(false)
        const el = document.querySelector(step.cible)
        if (!el) {
            setNotFound(true)
            return
        }
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        const timeout = setTimeout(mesurer, 320)
        return () => clearTimeout(timeout)
    }, [step, mesurer])

    // Recalcule la position au scroll/resize pendant que le spotlight est actif
    useEffect(() => {
        window.addEventListener('resize', mesurer)
        window.addEventListener('scroll', mesurer, true)
        return () => {
            window.removeEventListener('resize', mesurer)
            window.removeEventListener('scroll', mesurer, true)
        }
    }, [mesurer])

    // Navigation clavier
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') onClose()
            else if (e.key === 'ArrowRight') setIndex((i) => Math.min(i + 1, steps.length - 1))
            else if (e.key === 'ArrowLeft') setIndex((i) => Math.max(i - 1, 0))
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [steps.length])

    if (!step) return null

    const pad = 8

    const spotlightStyle = rect
        ? {
              position: 'fixed',
              top: rect.top - pad,
              left: rect.left - pad,
              width: rect.width + pad * 2,
              height: rect.height + pad * 2,
              borderRadius: 16,
              border: '2px solid var(--accent)',
              pointerEvents: 'none',
              zIndex: 9998,
              transition: 'top 0.25s ease, left 0.25s ease, width 0.25s ease, height 0.25s ease',
              animation: 'aideTourPulse 1.8s ease-in-out infinite',
          }
        : {
              position: 'fixed',
              inset: 0,
              background: 'rgba(2, 6, 23, 0.78)',
              zIndex: 9998,
          }

    const calloutStyle = { position: 'fixed', zIndex: 9999, width: 320 }
    if (rect) {
        const spaceBelow = window.innerHeight - rect.bottom
        if (spaceBelow > 240) {
            calloutStyle.top = rect.bottom + pad + 12
        } else {
            calloutStyle.bottom = window.innerHeight - rect.top + pad + 12
        }
        calloutStyle.left = Math.min(Math.max(rect.left, 16), window.innerWidth - 336)
    } else {
        calloutStyle.top = '50%'
        calloutStyle.left = '50%'
        calloutStyle.transform = 'translate(-50%, -50%)'
    }

    return (
        <>
            <style>{`
                @keyframes aideTourPulse {
                    0%, 100% { box-shadow: 0 0 0 9999px rgba(2,6,23,0.78), 0 0 0 0 rgba(16,185,129,0.45); }
                    50% { box-shadow: 0 0 0 9999px rgba(2,6,23,0.78), 0 0 0 8px rgba(16,185,129,0); }
                }
            `}</style>

            {/* Overlay + découpe autour de l'élément ciblé */}
            <div style={spotlightStyle} />

            {/* Callout explicatif */}
            <div style={calloutStyle} className="bg-card rounded-2xl border border-[var(--border-strong)] shadow-2xl p-5">
                <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--accent-light)]">
                        <MapPin size={12} /> Étape {index + 1} / {steps.length}
                    </span>
                    <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-h)] transition-colors">
                        <X size={16} />
                    </button>
                </div>

                <h4 className="text-[var(--text-h)] font-bold text-[15px] mb-1.5">{step.titre}</h4>
                <p className="text-[13px] text-[var(--text)] leading-relaxed mb-4">{step.description}</p>

                {notFound && (
                    <p className="text-[11px] text-[var(--accent-3)] mb-3">
                        Cet élément n'est pas visible sur la page en ce moment (peut-être masqué, ou pas encore chargé).
                    </p>
                )}

                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setIndex((i) => Math.max(i - 1, 0))}
                        disabled={index === 0}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-h)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft size={14} /> Précédent
                    </button>

                    {isLast ? (
                        <button
                            onClick={onClose}
                            className="text-xs font-bold bg-[var(--accent)] text-white px-3.5 py-1.5 rounded-lg hover:brightness-110 transition-all"
                        >
                            Terminer
                        </button>
                    ) : (
                        <button
                            onClick={() => setIndex((i) => Math.min(i + 1, steps.length - 1))}
                            className="inline-flex items-center gap-1 text-xs font-bold bg-[var(--accent)] text-white px-3.5 py-1.5 rounded-lg hover:brightness-110 transition-all"
                        >
                            Suivant <ChevronRight size={14} />
                        </button>
                    )}
                </div>
            </div>
        </>
    )
}
