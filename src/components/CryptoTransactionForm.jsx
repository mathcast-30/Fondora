import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { CRYPTOS_COURANTES } from '../lib/cryptosCourantes'
import { useCoursCrypto } from '../hooks/useCoursCrypto'

/**
 * Form component for adding crypto transactions (buy/sell)
 * @param {Object} props - Component props
 * @param {string} props.type - Transaction type ('buy' or 'sell')
 * @param {Array} props.positions - Available crypto positions for sell transactions
 * @param {Function} props.onSubmit - Callback when form is submitted
 * @param {Function} props.onCancel - Callback when form is cancelled
 * @param {Object} props.initialData - Initial form data for editing
 * @returns {JSX.Element} Crypto transaction form component
 */
function CryptoTransactionForm({ type = 'buy', positions = [], onSubmit, onCancel, initialData = null }) {
    const [form, setForm] = useState({
        coin_id: 'bitcoin',
        symbole: 'BTC',
        nom: 'Bitcoin',
        quantite: '',
        prix: '',
        date: new Date().toISOString().split('T')[0],
        fees: '0'
    })

    // Get current prices for selected crypto
    const { cours } = useCoursCrypto([form.coin_id])
    const currentPrice = cours[form.coin_id]?.eur || 0

    // If editing existing transaction, populate form
    useEffect(() => {
        if (initialData) {
            const crypto = CRYPTOS_COURANTES.find(c => c.coinId === initialData.coin_id || c.symbole === initialData.symbole)
            setForm({
                coin_id: initialData.coin_id || '',
                symbole: initialData.symbole || crypto?.symbole || '',
                nom: initialData.nom || crypto?.nom || '',
                quantite: initialData.quantity || initialData.quantite || '',
                prix: initialData.price || initialData.prix || '',
                date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                fees: initialData.fees || initialData.frais || '0'
            })
        }
    }, [initialData])

    const handleSubmit = (e) => {
        e.preventDefault()
        onSubmit({
            ...form,
            quantite: parseFloat(form.quantite),
            prix: parseFloat(form.prix),
            fees: parseFloat(form.fees),
            type: type,
            date: new Date(form.date).toISOString()
        })
    }

    const isSell = type === 'sell'
    const availableCoins = isSell ? positions : CRYPTOS_COURANTES

    const handleCoinChange = (coinId) => {
        const crypto = CRYPTOS_COURANTES.find(c => c.coinId === coinId)
        if (crypto) {
            setForm({
                ...form,
                coin_id: coinId,
                symbole: crypto.symbole,
                nom: crypto.nom
            })
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="text-sm text-gray-600 mb-1 block">Cryptomonnaie</label>
                <select
                    value={form.coin_id}
                    onChange={(e) => handleCoinChange(e.target.value)}
                    required
                    className="w-full border rounded-lg px-3 py-2"
                >
                    <option value="">Sélectionner une crypto</option>
                    {availableCoins.map(coin => {
                        const coinData = typeof coin === 'string' ? CRYPTOS_COURANTES.find(c => c.coinId === coin) : coin
                        return (
                            <option key={coinData.coinId} value={coinData.coinId}>
                                {coinData.nom} ({coinData.symbole})
                            </option>
                        )
                    })}
                </select>
            </div>

            {currentPrice > 0 && (
                <div className="bg-graylight rounded-lg p-3 text-sm">
                    <p className="text-gray-600">
                        Prix actuel: {new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: 'EUR'
                        }).format(currentPrice)}
                    </p>
                </div>
            )}

            <div className="flex gap-3">
                <div className="flex-1">
                    <label className="text-sm text-gray-600 mb-1 block">Quantité</label>
                    <input 
                        type="number" 
                        step="0.00000001" 
                        required 
                        value={form.quantite}
                        onChange={(e) => setForm({ ...form, quantite: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2"
                    />
                </div>
                <div className="flex-1">
                    <label className="text-sm text-gray-600 mb-1 block">Prix (EUR)</label>
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

export default CryptoTransactionForm
