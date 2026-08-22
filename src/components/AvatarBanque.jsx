// Avatar déterministe (pas d'appel réseau, pas de logo externe) : initiales + couleur
// stable dérivée du nom de la banque, cohérent d'une session à l'autre.
const PALETTE = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

function hashCouleur(str) {
    let hash = 0
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
    return PALETTE[Math.abs(hash) % PALETTE.length]
}

function initiales(nomBanque) {
    const mots = nomBanque.trim().split(/\s+/)
    if (mots.length === 1) return mots[0].slice(0, 2).toUpperCase()
    return (mots[0][0] + mots[1][0]).toUpperCase()
}

export default function AvatarBanque({ banque, couleurFallback }) {
    if (!banque) {
        return <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: couleurFallback }} />
    }
    return (
        <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0"
            style={{ backgroundColor: hashCouleur(banque) }}
            title={banque}
        >
            {initiales(banque)}
        </div>
    )
}