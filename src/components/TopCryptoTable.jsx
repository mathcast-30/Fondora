function TopCryptoTable({ data, loading }) {
    const formatMontant = (m) =>
        new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(m)

    const formatCapitalisation = (m) =>
        new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 }).format(m) + ' €'

    if (loading) {
        return <p className="text-gray-400 text-center py-8">Chargement du marché...</p>
    }

    return (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
                <thead className="bg-graylight text-gray-500 text-xs">
                    <tr>
                        <th className="text-left px-4 py-3 font-medium">Nom</th>
                        <th className="text-right px-4 py-3 font-medium">Prix</th>
                        <th className="text-right px-4 py-3 font-medium">24h</th>
                        <th className="text-right px-4 py-3 font-medium">7j</th>
                        <th className="text-right px-4 py-3 font-medium">Capitalisation</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {data.map((coin) => (
                        <tr key={coin.id}>
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <img src={coin.image} alt={coin.name} className="w-6 h-6" />
                                    <div>
                                        <p className="font-medium text-navy">{coin.name}</p>
                                        <p className="text-xs text-gray-400 uppercase">{coin.symbol}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="text-right px-4 py-3 font-medium text-navy">{formatMontant(coin.current_price)}</td>
                            <td className={`text-right px-4 py-3 ${coin.price_change_percentage_24h >= 0 ? 'text-emerald' : 'text-red-500'}`}>
                                {coin.price_change_percentage_24h >= 0 ? '+' : ''}{coin.price_change_percentage_24h?.toFixed(1)}%
                            </td>
                            <td className={`text-right px-4 py-3 ${coin.price_change_percentage_7d_in_currency >= 0 ? 'text-emerald' : 'text-red-500'}`}>
                                {coin.price_change_percentage_7d_in_currency >= 0 ? '+' : ''}{coin.price_change_percentage_7d_in_currency?.toFixed(1)}%
                            </td>
                            <td className="text-right px-4 py-3 text-gray-500">{formatCapitalisation(coin.market_cap)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default TopCryptoTable