// Toast impératif léger (sans dépendance ni contexte React).
// Permet de remonter les erreurs Supabase silencieuses depuis les hooks,
// là où il n'y a pas de composant pour gérer un état d'erreur.
//
// Usage :
//   import { toastError, toastSuccess } from '../utils/toast'
//   if (error) toastError(error.message)

const TOAST_CONTAINER_ID = 'fondora-toast-container'
const TOAST_DURATION = 4000

function getContainer() {
    let el = document.getElementById(TOAST_CONTAINER_ID)
    if (!el) {
        el = document.createElement('div')
        el.id = TOAST_CONTAINER_ID
        el.style.cssText = [
            'position:fixed',
            'bottom:24px',
            'right:24px',
            'z-index:9999',
            'display:flex',
            'flex-direction:column',
            'gap:8px',
            'pointer-events:none',
            'max-width:360px',
        ].join(';')
        document.body.appendChild(el)
    }
    return el
}

function showToast(message, type = 'info') {
    // En environnement non-navigateur (SSR/tests), ne rien faire.
    if (typeof document === 'undefined') return

    const container = getContainer()
    const toast = document.createElement('div')
    const bg = type === 'error' ? '#ef4444' : type === 'success' ? '#10B981' : '#1f2937'
    toast.style.cssText = [
        'background:' + bg,
        'color:#fff',
        'padding:12px 16px',
        'border-radius:8px',
        'box-shadow:0 8px 24px rgba(0,0,0,0.3)',
        'font-family:inherit',
        'font-size:14px',
        'line-height:1.4',
        'pointer-events:auto',
        'opacity:0',
        'transform:translateX(20px)',
        'transition:opacity 0.2s, transform 0.2s',
    ].join(';')
    toast.textContent = message
    container.appendChild(toast)

    requestAnimationFrame(() => {
        toast.style.opacity = '1'
        toast.style.transform = 'translateX(0)'
    })

    setTimeout(() => {
        toast.style.opacity = '0'
        toast.style.transform = 'translateX(20px)'
        setTimeout(() => toast.remove(), 220)
    }, TOAST_DURATION)
}

export function toastError(message) {
    showToast(message, 'error')
}

export function toastSuccess(message) {
    showToast(message, 'success')
}
