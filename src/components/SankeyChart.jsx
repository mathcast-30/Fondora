import { useState } from 'react'
import { Sankey, Tooltip, ResponsiveContainer } from 'recharts'
import { useIncognito } from '../context/IncognitoContext'
import { Shuffle, X } from 'lucide-react'

/**
 * Diagramme de flux financier interactif.
 * - Clic simple sur une catégorie → filtre le tableau de transactions (onFiltrerCategorie)
 * - Mode "Réaffectation" → cliquer catégorie A puis B déclenche onDemandeRecategorisation(nomA, nomB)
 */
function SankeyChart({
    totalRevenus,
    depensesParCategorie,
    onFiltrerCategorie,
    categorieFiltree,
    onDemandeRecategorisation,
}) {
    const { incognito } = useIncognito()
    const [modeReaffectation, setModeReaffectation] = useState(false)
    const [sourceSelectionnee, setSourceSelectionnee] = useState(null)

    const nodes = [
        { name: 'Revenus' },
        ...depensesParCategorie.map((d) => ({ name: d.nom })),
    ]

    const links = depensesParCategorie.map((d, index) => ({
        source: 0,
        target: index + 1,
        value: d.montant,
    }))

    const toggleModeReaffectation = () => {
        setModeReaffectation((v) => !v)
        setSourceSelectionnee(null)
    }

    const handleNodeClick = (nom) => {
        if (nom === 'Revenus') return

        if (modeReaffectation) {
            if (!sourceSelectionnee) {
                setSourceSelectionnee(nom)
            } else if (sourceSelectionnee === nom) {
                setSourceSelectionnee(null)
            } else {
                onDemandeRecategorisation?.(sourceSelectionnee, nom)
                setSourceSelectionnee(null)
                setModeReaffectation(false)
            }
            return
        }

        onFiltrerCategorie?.(categorieFiltree === nom ? null : nom)
    }

    const CustomNode = (props) => {
        const { x, y, width, height, payload } = props
        const nom = payload.name
        const isRevenus = nom === 'Revenus'
        const isSource = nom === sourceSelectionnee
        const isFiltree = nom === categorieFiltree

        let fill = '#1c233a'
        let stroke = '#0a1f33'
        let strokeWidth = 1
        if (isRevenus) { fill = '#334155' }
        else if (isSource) { fill = '#10b981'; stroke = '#34d399'; strokeWidth = 2 }
        else if (isFiltree) { fill = '#0ea5e9'; stroke = '#38bdf8'; strokeWidth = 2 }

        return (
            <g onClick={() => handleNodeClick(nom)} style={{ cursor: isRevenus ? 'default' : 'pointer' }}>
                <rect x={x} y={y} width={width} height={height} fill={fill} stroke={stroke} strokeWidth={strokeWidth} rx={3} />
                <text
                    x={x + width + 8}
                    y={y + height / 2}
                    textAnchor="start"
                    dominantBaseline="middle"
                    fontSize={12}
                    fill={isSource || isFiltree ? '#e2e8f0' : '#94a3b8'}
                    fontWeight={isSource || isFiltree ? 600 : 400}
                >
                    {nom}
                </text>
            </g>
        )
    }

    if (depensesParCategorie.length === 0) {
        return <p className="text-gray-400 text-center py-10">Pas encore de dépenses ce mois-ci.</p>
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                <button
                    onClick={toggleModeReaffectation}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition
                        ${modeReaffectation
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                            : 'bg-[var(--bg)] border-[var(--border)] text-[var(--text)] hover:text-[var(--text-h)]'
                        }`}
                >
                    <Shuffle size={13} />
                    {modeReaffectation ? 'Mode réaffectation actif' : 'Réaffecter des catégories'}
                </button>

                {modeReaffectation && (
                    <span className="text-xs text-[var(--text)]">
                        {sourceSelectionnee
                            ? <>Cliquez la catégorie <strong className="text-emerald-400">cible</strong> pour recatégoriser <strong>{sourceSelectionnee}</strong></>
                            : 'Cliquez une catégorie source'}
                    </span>
                )}

                {!modeReaffectation && categorieFiltree && (
                    <button
                        onClick={() => onFiltrerCategorie?.(null)}
                        className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20"
                    >
                        Filtré : {categorieFiltree} <X size={11} />
                    </button>
                )}
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <Sankey
                    data={{ nodes, links }}
                    node={CustomNode}
                    link={{ stroke: '#10b981', strokeOpacity: 0.3 }}
                    nodePadding={20}
                    margin={{ left: 10, right: 90, top: 10, bottom: 10 }}
                >
                    <Tooltip formatter={(value) => incognito ? '••••' : value} />
                </Sankey>
            </ResponsiveContainer>
        </div>
    )
}

export default SankeyChart