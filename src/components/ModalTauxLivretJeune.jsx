import { useState } from 'react'
import Modal from './Modal'
import { useTauxLivretJeune } from '../hooks/useTauxLivretJeune'

export default function ModalTauxLivretJeune({ compte, onClose }) {
    const { tauxActuel, historique, definirNouveauTaux } = useTauxLivretJeune(compte?.id)
    const [taux, setTaux] = useState('')
    const [erreur, setErreur] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setErreur('')
        const valeur = parseFloat(taux)
        if (isNaN(valeur) || valeur < 0 || valeur > 15) {
            setErreur('Merci de saisir un taux réaliste (entre 0 et 15 %).')
            return
        }
        const { error } = await definirNouveauTaux(valeur)
        if (!error) { setTaux(''); onClose() }
        else setErreur("Erreur lors de l'enregistrement.")
    }

    return (
        <Modal isOpen={!!compte} onClose={onClose} title={`Taux du Livret Jeune — ${compte?.nom || ''}`}>
            <div className="space-y-4">
                {tauxActuel != null && (
                    <p className="text-sm text-[var(--text)]">
                        Taux actuel : <span className="font-semibold text-emerald">{tauxActuel} %</span>
                    </p>
                )}
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="text-sm text-[var(--text)] mb-1 block">Nouveau taux (%)</label>
                        <input type="number" step="0.01" min="0" max="15" value={taux}
                            onChange={(e) => setTaux(e.target.value)} placeholder="Ex: 2.5"
                            className="w-full border border-[var(--border)] bg-surface text-[var(--text-h)] rounded-lg px-3 py-2" />
                        <p className="text-xs text-[var(--text-muted)] mt-1">
                            Le taux du Livret Jeune est fixé librement par ta banque (minimum légal : le taux du Livret A).
                        </p>
                    </div>
                    {erreur && <p className="text-xs text-[var(--negative)]">{erreur}</p>}
                    <button type="submit" className="w-full bg-emerald hover:bg-emerald-light text-white font-semibold py-2 rounded-lg transition">
                        Enregistrer ce taux
                    </button>
                </form>
                {historique.length > 0 && (
                    <div>
                        <p className="text-xs text-[var(--text-muted)] mb-2">Historique</p>
                        <div className="divide-y divide-[var(--border)]">
                            {historique.map((h) => (
                                <div key={h.id} className="flex justify-between py-1.5 text-sm">
                                    <span className="text-[var(--text)]">Depuis le {new Date(h.date_effet).toLocaleDateString('fr-FR')}</span>
                                    <span className="font-medium text-[var(--text-h)]">{h.taux} %</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    )
}