import { useState, useEffect } from 'react'

export function useCoursCrypto(coinIds) {
    const [cours, setCours] = useState({})
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!coinIds || coinIds.length === 0) return

        const charger = async () => {
            setLoading(true)
            try {
                const idsUniques = [...new Set(coinIds)].join(',')
                const reponse = await fetch(
                    `https://api.coingecko.com/api/v3/simple/price?ids=${idsUniques}&vs_currencies=eur&include_24hr_change=true`
                )
                const data = await reponse.json()
                setCours(data)
            } catch (error) {
                console.error('Erreur chargement cours crypto:', error)
            }
            setLoading(false)
        }

        charger()
    }, [JSON.stringify(coinIds)])

    return { cours, loading }
}