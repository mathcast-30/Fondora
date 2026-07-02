import { useState, useEffect } from 'react'

export function useTopCrypto(nombre = 10) {
    const [topCrypto, setTopCrypto] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const charger = async () => {
            setLoading(true)
            try {
                const reponse = await fetch(
                    `https://api.coingecko.com/api/v3/coins/markets?vs_currency=eur&order=market_cap_desc&per_page=${nombre}&page=1&price_change_percentage=24h,7d`
                )
                const data = await reponse.json()
                setTopCrypto(data)
            } catch (error) {
                console.error('Erreur chargement top crypto:', error)
            }
            setLoading(false)
        }
        charger()
    }, [nombre])

    return { topCrypto, loading }
}