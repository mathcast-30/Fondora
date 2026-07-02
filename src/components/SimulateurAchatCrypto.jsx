import { useState } from 'react'
import { CRYPTOS_COURANTES } from '../lib/cryptosCourantes'
import { useCoursCrypto } from '../hooks/useCoursCrypto'

function SimulateurAchatCrypto({ onAjouter }) {
    const [coinId, setCoinId] = useState('bitcoin')
    const [montantEur, setMontantEur] = useState('')

    const { cours } = useCoursCrypto([coinId])
    const prixActuel = cours[coinId]?.eur || 0
    const quantiteEstimee = prixActuel > 0 && montantEur ? parseFloat(montantEur) / prixActuel : 0

    const cryptoSelectionnee = CRYPTOS_COURANTES.find((c) => c.coinId === coinId)

    const handleAchat = async () => {
        if (!montantEur || quantiteEstimee === 0) return
        await onAjouter({
            coin_id: coinId,
            symbole: cryptoSelectionnee.symbole,
            nom: cryptoSelectionnee.nom,
            quantite: quantiteEstimee,
            prix_achat_moyen: prixActuel,
        })
        setMontantEur('')
    }

    return (
        <div className="bg-navy rounded-2xl p-6 text-white">
            <p className="text-gray-300 text-sm mb-4">Acheter une crypto (simulation)</p>

            <select
                value={coinId}
                onChange={(e) => setCoinId(e.target.value)}
                className="w-full bg-navy-light border border-gray-600 rounded-lg px-3 py-2 mb-4 text-white"
            >
                {CRYPTOS_COURANTES.map((c) => (
                    <option key={c.coinId} value={c.coinId}>{c.nom} ({c.symbole})</option>
                ))}
            </select>

            <div className="mb-4">
                <p className="text-3xl font-bold mb-1">
                    {quantiteEstimee > 0 ? quantiteEstimee.toFixed(6) : '0,000000'} {cryptoSelectionnee?.symbole}
                </p>
                <p className="text-gray-400 text-sm">
                    {prixActuel > 0 ? `1 ${cryptoSelectionnee?.symbole} = ${prixActuel.toLocaleString('fr-FR')} €` : 'Chargement du cours...'}
                </p>
            </div>

            <div className="flex gap-2 mb-4">
                <input
                    type="number"
                    step="0.01"
                    placeholder="Montant en €"
                    value={montantEur}
                    onChange={(e) => setMontantEur(e.target.value)}
                    className="flex-1 bg-navy-light border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500"
                />
                <span className="flex items-center px-3 text-gray-400">EUR</span>
            </div>

            <div className="flex gap-2 mb-4">
                {[25, 50, 100, 250].map((montant) => (
                    <button
                        key={montant}
                        onClick={() => setMontantEur(String(montant))}
                        className="flex-1 bg-navy-light hover:bg-gray-700 rounded-lg py-1.5 text-sm transition"
                    >
                        {montant}€
                    </button>
                ))}
            </div>

            <button
                onClick={handleAchat}
                disabled={!montantEur || quantiteEstimee === 0}
                className="w-full bg-emerald hover:bg-emerald-light disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition"
            >
                Simuler l'achat
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">
                Ceci est une simulation, aucun achat réel n'est effectué.
            </p>
        </div>
    )
}

export default SimulateurAchatCrypto