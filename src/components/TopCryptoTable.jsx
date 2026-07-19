import SecureValue from './SecureValue'

function TopCryptoTable({ data, loading }) {
    const formatMontant = (m) =>
        new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(m)

    const formatCapitalisation = (m) =>
        new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 }).format(m) + ' €'

    if (loading) {
        return <p className="text-[var(--text)] text-center py-8">Chargement du marché...</p>
    }

    return (
        <div className="bg-card rounded-xl shadow-sm overflow-hidden border border-[var(--border)]">
            <table className="w-full text-sm">
                <thead className="bg-surface text-[var(--text)] text-xs">
                    <tr>
                        <th className="text-left px-4 py-3 font-medium">Nom</th>
                        <th className="text-right px-4 py-3 font-medium">Prix</th>
                        <th className="text-right px-4 py-3 font-medium">24h</th>
                        <th className="text-right px-4 py-3 font-medium">7j</th>
                        <th className="text-right px-4 py-3 font-medium">Capitalisation</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                    {data.map((coin) => (
                        <tr key={coin.id}>
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <img src={coin.image} alt={coin.name} className="w-6 h-6" />
                                    <div>
                                        <p className="font-medium text-[var(--text-h)]">{coin.name}</p>
                                        <p className="text-xs text-[var(--text)] uppercase">{coin.symbol}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="text-right px-4 py-3 font-medium text-[var(--text-h)]"><SecureValue value={coin.current_price} formatter={formatMontant} /></td>
                            <td className={`text-right px-4 py-3 ${coin.price_change_percentage_24h >= 0 ? 'text-emerald' : 'text-[var(--negative)]'}`}>
                                {coin.price_change_percentage_24h >= 0 ? '+' : ''}{coin.price_change_percentage_24h?.toFixed(1)}%
                            </td>
                            <td className={`text-right px-4 py-3 ${coin.price_change_percentage_7d_in_currency >= 0 ? 'text-emerald' : 'text-[var(--negative)]'}`}>
                                {coin.price_change_percentage_7d_in_currency >= 0 ? '+' : ''}{coin.price_change_percentage_7d_in_currency?.toFixed(1)}%
                            </td>
                            <td className="text-right px-4 py-3 text-[var(--text)]"><SecureValue value={coin.market_cap} formatter={formatCapitalisation} /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default TopCryptoTable