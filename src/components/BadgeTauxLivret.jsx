import { Percent } from 'lucide-react'
import { useTauxReglementes } from '../hooks/useTauxReglementes'
import { useTauxLivretJeune } from '../hooks/useTauxLivretJeune'

const TYPE_CODE = { 'livret a': 'LIVRET_A', 'ldds': 'LDDS', 'lep': 'LEP', 'livret jeune': 'LIVRET_JEUNE' }

export default function BadgeTauxLivret({ compte }) {
    const typeCode = TYPE_CODE[(compte.type || '').trim().toLowerCase()]
    const { getTauxActuel } = useTauxReglementes()
    const { tauxActuel: tauxLivretJeune } = useTauxLivretJeune(typeCode === 'LIVRET_JEUNE' ? compte.id : null)

    if (!typeCode) return null

    const taux = typeCode === 'LIVRET_JEUNE' ? tauxLivretJeune : getTauxActuel(typeCode)
    if (taux == null) return null

    return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald bg-emerald/10 px-2 py-0.5 rounded-full">
            <Percent size={11} />
            {taux.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 3 })} %
        </span>
    )
}