import { useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import { useTauxReglementes } from '../hooks/useTauxReglementes'

const SEUIL_RESERVE = 3000 // on ne suggère de bouger que le surplus au-delà de cette réserve de précaution

export default function AlerteArgentQuiDort({ comptes }) {
    const [masquee, setMasquee] = useState(false)
    const { getTauxActuel } = useTauxReglementes()
    const tauxLivretA = getTauxActuel('LIVRET_A')

    if (masquee || tauxLivretA == null) return null

    const comptesCourants = comptes.filter((c) =>
        ['compte courant', 'compte chèques', 'compte cheques', 'espèces', 'especes'].includes((c.type || '').trim().toLowerCase())
    )
    const surplus = comptesCourants.reduce((s, c) => s + Math.max((c.soldeReel ?? c.solde) - SEUIL_RESERVE, 0), 0)

    if (surplus < 500) return null // pas assez significatif pour déranger l'utilisateur

    const gainAnnuelEstime = Math.round(surplus * (tauxLivretA / 100))

    return (
        <div className="bg-emerald/10 border border-emerald/20 rounded-xl p-4 mb-4 flex items-start gap-3">
            <Sparkles size={18} className="text-emerald shrink-0 mt-0.5" />
            <div className="flex-1">
                <p className="text-sm text-[var(--text-h)]">
                    Tu as environ <strong>{surplus.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</strong> qui dort sur tes comptes courants au-delà d'une réserve de précaution de {SEUIL_RESERVE.toLocaleString('fr-FR')} €.
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                    Placé sur un Livret A (taux actuel {tauxLivretA} %), ça rapporterait environ <strong className="text-emerald">+{gainAnnuelEstime} €/an</strong>.
                </p>
            </div>
            <button onClick={() => setMasquee(true)} className="text-[var(--text-muted)] hover:text-[var(--text)] shrink-0">
                <X size={16} />
            </button>
        </div>
    )
}