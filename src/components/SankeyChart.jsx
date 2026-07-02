import { Sankey, Tooltip, ResponsiveContainer } from 'recharts'

function SankeyChart({ totalRevenus, depensesParCategorie }) {
    // Construction des nœuds : Revenus -> chaque catégorie de dépense
    const nodes = [
        { name: 'Revenus' },
        ...depensesParCategorie.map((d) => ({ name: d.nom })),
    ]

    const links = depensesParCategorie.map((d, index) => ({
        source: 0,
        target: index + 1,
        value: d.montant,
    }))

    if (depensesParCategorie.length === 0) {
        return <p className="text-gray-400 text-center py-10">Pas encore de dépenses ce mois-ci.</p>
    }

    return (
        <ResponsiveContainer width="100%" height={320}>
            <Sankey
                data={{ nodes, links }}
                node={{ stroke: '#0a1f33', strokeWidth: 1 }}
                link={{ stroke: '#10b981', strokeOpacity: 0.3 }}
                nodePadding={20}
            >
                <Tooltip />
            </Sankey>
        </ResponsiveContainer>
    )
}

export default SankeyChart