import { useState, useEffect } from 'react'
import { Plus, X } from 'lucide-react'

/**
 * Form component for adding investment transactions (buy/sell)
 * @param {Object} props - Component props
 * @param {string} props.type - Transaction type ('buy' or 'sell')
 * @param {Array} props.positions - Available positions for sell transactions
 * @param {Function} props.onSubmit - Callback when form is submitted
 * @param {Function} props.onCancel - Callback when form is cancelled
 * @param {Object} props.initialData - Initial form data for editing
 * @returns {JSX.Element} Transaction form component
 */
function TransactionForm({ type = 'buy', positions = [], onSubmit, onCancel, initialData = null }) {
    const [form, setForm] = useState({
        symbole: '',
        quantite: '',
        prix: '',
        date: new Date().toISOString().split('T')[0],
        type_compte: 'PEA',
        fees: '0'
    })

    // If editing existing transaction, populate form
    useEffect(() => {
        if (initialData) {
            setForm({
                symbole: initialData.symbole || '',
                quantite: initialData.quantity || initialData.quantite || '',
                prix: initialData.price || initialData.prix || '',
                date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                type_compte: initialData.type_compte || 'PEA',
                fees: initialData.fees || initialData.frais || '0'
            })
        }
    }, [initialData])

    const handleSubmit = (e) => {
        e.preventDefault()
        onSubmit({
            ...form,
            symbole: form.symbole.toUpperCase(),
            quantite: parseFloat(form.quantite),
            prix: parseFloat(form.prix),
            fees: parseFloat(form.fees),
            type: type,
            date: new Date(form.date).toISOString()
        })
    }

    const isSell = type === 'sell'
    const availableSymbols = [...new Set(positions.map(p => p.symbole))]

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="text-sm text-gray-600 mb-1 block">Symbole boursier</label>
                {isSell ? (
                    <select
                        value={form.symbole}
                        onChange={(e) => setForm({ ...form, symbole: e.target.value })}
                        required
                        className="w-full border rounded-lg px-3 py-2"
                    >
                        <option value="">Sélectionner un symbole</option>
                        {availableSymbols.map(symbole => (
                            <option key={symbole} value={symbole}>{symbole}</option>
                        ))}
                    </select>
                ) : (
                    <input 
                        type="text" 
                        required 
                        value={form.symbole}
                        onChange={(e) => setForm({ ...form, symbole: e.target.value })}
                        placeholder="Ex: AAPL, MC.PA, VWCE.DE"
                        className="w-full border rounded-lg px-3 py-2"
                    />
                )}
            </div>

            <div className="flex gap-3">
                <div className="flex-1">
                    <label className="text-sm text-gray-600 mb-1 block">Quantité</label>
                    <input 
                        type="number" 
                        step="0.0001" 
                        required 
                        value={form.quantite}
                        onChange={(e) => setForm({ ...form, quantite: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2"
                    />
                </div>
                <div className="flex-1">
                    <label className="text-sm text-gray-600 mb-1 block">Prix</label>
                    <input 
                        type="number" 
                        step="0.01" 
                        required 
                        value={form.prix}
                        onChange={(e) => setForm({ ...form, prix: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2"
                    />
                </div>
            </div>

            <div className="flex gap-3">
                <div className="flex-1">
                    <label className="text-sm text-gray-600 mb-1 block">Date</label>
                    <input 
                        type="date" 
                        required 
                        value={form.date}
                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2"
                    />
                </div>
                <div className="flex-1">
                    <label className="text-sm text-gray-600 mb-1 block">Type de compte</label>
                    <select 
                        value={form.type_compte} 
                        onChange={(e) => setForm({ ...form, type_compte: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2"
                    >
                        <option value="PEA">PEA</option>
                        <option value="CTO">CTO</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="text-sm text-gray-600 mb-1 block">Frais (optionnel)</label>
                <input 
                    type="number" 
                    step="0.01" 
                    value={form.fees}
                    onChange={(e) => setForm({ ...form, fees: e.target.value })}
                    placeholder="0"
                    className="w-full border rounded-lg px-3 py-2"
                />
            </div>

            <div className="flex gap-2">
                <button 
                    type="button" 
                    onClick={onCancel}
                    className="flex-1 bg-graylight hover:bg-gray-200 text-gray-700 font-semibold py-2 rounded-lg transition"
                >
                    Annuler
                </button>
                <button 
                    type="submit" 
                    className="flex-1 bg-emerald hover:bg-emerald-light text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
                >
                    <Plus size={18} /> {isSell ? 'Vendre' : 'Acheter'}
                </button>
            </div>
        </form>
    )
}

export default TransactionForm
