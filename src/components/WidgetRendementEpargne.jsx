import { TrendingUp } from 'lucide-react'
import { useTauxReglementes } from '../hooks/useTauxReglementes'
import { useTauxLivretJeuneTous } from '../hooks/useTauxLivretJeune'

const TYPE_CODE = { 'livret a': 'LIVRET_A', 'ldds': 'LDDS', 'lep': 'LEP', 'livret jeune': 'LIVRET_JEUNE' }

export default function WidgetRendementEpargne({ comptes }) {
    const { getTauxActuel } = useTauxReglementes()
    const tauxLivretJeuneParCompte = useTauxLivretJeuneTous()

    const livrets = comptes
        .map((c) => {
            const typeCode = TYPE_CODE[(c.type || '').trim().toLowerCase()]
            if (!typeCode) return null
            const taux = typeCode === 'LIVRET_JEUNE' ? tauxLivretJeuneParCompte[c.id] : getTauxActuel(typeCode)
            if (taux == null) return null
            return { solde: Math.max(c.soldeReel ?? c.solde, 0), taux }
        })
        .filter(Boolean)

    if (livrets.length === 0) return null

    const soldeTotal = livrets.reduce((s, l) => s + l.solde, 0)
    if (soldeTotal === 0) return null

    const rendementPondere = livrets.reduce((s, l) => s + l.solde * l.taux, 0) / soldeTotal
    const gainAnnuelEstime = Math.round(soldeTotal * (rendementPondere / 100))

    return (
        <div className="flex items-center gap-2 bg-emerald/10 px-3 py-1.5 rounded-lg text-xs">
            <TrendingUp size={13} className="text-emerald" />
            <span className="text-[var(--text)]">
                Rendement moyen épargne : <strong className="text-emerald">{rendementPondere.toFixed(2)} %</strong>
                {' '}(≈ +{gainAnnuelEstime} €/an)
            </span>
        </div>
    )
}
