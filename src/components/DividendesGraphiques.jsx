import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import DonutChart from './DonutChart'
import { useIncognito } from '../context/IncognitoContext'

function DividendesGraphiques({ dividendes, synthese }) {
    const { incognito } = useIncognito()
    const formatMontant = (m) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(m)

    // Regroupement par mois (12 derniers mois), en net après fiscalité
    const dataParMois = (() => {
        const map = {}
        const aujourdHui = new Date()
        for (let i = 11; i >= 0; i--) {
            const d = new Date(aujourdHui.getFullYear(), aujourdHui.getMonth() - i, 1)
            const cle = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            map[cle] = { label: d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }), net: 0, brut: 0 }
        }
        for (const div of dividendes || []) {
            const d = new Date(div.date)
            const cle = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            if (map[cle]) {
                map[cle].net += div.fiscal?.montantNet ?? div.montant
                map[cle].brut += div.montant
            }
        }
        return Object.values(map)
    })()

    const dataEnveloppe = [
        { nom: 'PEA', montant: synthese?.parEnveloppe?.PEA?.net || 0, couleur: '#6366f1' },
        { nom: 'CTO', montant: synthese?.parEnveloppe?.CTO?.net || 0, couleur: '#f59e0b' },
    ].filter((d) => d.montant > 0)

    return (
        <div className="grid grid-cols-5 gap-4 mb-4">
            <div className="col-span-3 bg-white rounded-xl p-5 shadow-sm">
                <h4 className="text-navy font-semibold text-sm mb-3">Dividendes nets perçus par mois</h4>
                <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={dataParMois} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => incognito ? '••••' : `${v}€`} />
                        <Tooltip formatter={(v) => incognito ? '••••' : formatMontant(v)} />
                        <Bar dataKey="net" name="Net perçu" fill="#10b981" radius={[4, 4, 0, 0]} barSize={16} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="col-span-2 bg-white rounded-xl p-5 shadow-sm">
                <h4 className="text-navy font-semibold text-sm mb-3 text-center">Répartition par enveloppe</h4>
                {dataEnveloppe.length > 0 ? (
                    <DonutChart data={dataEnveloppe} total={dataEnveloppe.reduce((s, d) => s + d.montant, 0)} libelleCentre="Net" />
                ) : (
                    <p className="text-gray-400 text-sm text-center py-10">Aucun dividende enregistré.</p>
                )}
            </div>
        </div>
    )
}

export default DividendesGraphiques