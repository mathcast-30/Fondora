import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

export default function ExportDonnees() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)

    const handleExport = async () => {
        setLoading(true)
        setError(null)
        setSuccess(false)
        try {
            const { data, error: functionError } = await supabase.functions.invoke('export-donnees')
            
            if (functionError) {
                throw new Error(functionError.message || "Erreur lors de la récupération des données.")
            }

            if (!data) {
                throw new Error("Aucune donnée retournée par le serveur.")
            }

            // Génération du fichier JSON et téléchargement automatique
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const date = new Date().toISOString().split('T')[0]
            
            const link = document.createElement('a')
            link.href = url
            link.download = `fondora-mes-donnees-${date}.json`
                        document.body.appendChild(link)
            link.click()
            link.remove()
            URL.revokeObjectURL(url)

            setSuccess(true)
        } catch (err) {
            console.error("Export error:", err)
            setError(err.message || "Une erreur inconnue est survenue lors de l'exportation.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Layout>
            <div className="max-w-2xl bg-white rounded-xl p-8 shadow-sm">
                <h1 className="text-navy text-3xl font-bold mb-2">Exportation des données personnelles</h1>
                <p className="text-gray-500 mb-6">
                    Conformément au Règlement Général sur la Protection des Données (RGPD, Art. 20), vous disposez du droit à la portabilité de vos données.
                </p>

                <div className="space-y-4 mb-8 text-sm text-navy/80 leading-relaxed">
                    <p>
                        Cet outil vous permet de télécharger une copie complète et structurée de toutes les données personnelles et financières que vous avez stockées sur Fondora.
                    </p>
                    <div className="bg-graylight p-4 rounded-lg border border-gray-200">
                        <p className="font-semibold text-navy mb-2">Contenu de l'export (Format JSON) :</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>Profil utilisateur :</strong> prénom, nom d'affichage, objectifs, préférences de l'application et devise.</li>
                            <li><strong>Comptes :</strong> la liste de vos comptes bancaires et soldes.</li>
                            <li><strong>Transactions :</strong> l'historique complet de vos revenus et dépenses par catégorie.</li>
                            <li><strong>Investissements :</strong> vos positions d'investissement (actions, ETF, crypto, assurances-vie).</li>
                            <li><strong>Biens immobiliers :</strong> vos acquisitions immobilières et dettes associées.</li>
                            <li><strong>Budgets :</strong> vos objectifs budgétaires mensuels configurés.</li>
                        </ul>
                    </div>
                    <p>
                        Pour en savoir plus sur l'exercice de vos droits ou le traitement de ces données, vous pouvez consulter notre{' '}
                        <Link to="/politique-confidentialite#droits" className="text-emerald hover:underline font-medium">
                            Politique de confidentialité (Section Droits RGPD)
                        </Link>.
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-700 text-sm p-4 rounded-lg border border-red-200 mb-6 flex flex-col gap-1">
                        <span className="font-semibold">⚠️ Échec de l'exportation</span>
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="bg-emerald-50 text-emerald-800 text-sm p-4 rounded-lg border border-emerald-200 mb-6">
                        🎉 Vos données ont été exportées avec succès sous forme de fichier JSON.
                    </div>
                )}

                <button
                    onClick={handleExport}
                    disabled={loading}
                    className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition text-white cursor-pointer ${
                        loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald hover:bg-emerald-light'
                    }`}
                >
                    {loading && (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    )}
                    {loading ? 'Génération du fichier...' : 'Télécharger mes données (JSON)'}
                </button>
            </div>
        </Layout>
    )
}
