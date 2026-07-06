import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function FormulaireAchatVente({ compteId, onTransactionSuccess, onSelectActif, typeInitial = 'ACHAT', positionsExistantes = [] }) {
  const [recherche, setRecherche] = useState('');
  const [resultats, setResultats] = useState([]);
  const [actifSelectionne, setActifSelectionne] = useState(null);
  const [type, setType] = useState(typeInitial);
  const [quantite, setQuantite] = useState('');
  const [prix, setPrix] = useState('');
  const [loadingEnrich, setLoadingEnrich] = useState(false);
  const [loadingPrix, setLoadingPrix] = useState(false);

  // Reset quand typeInitial change (ouverture modal achat vs vente)
  useEffect(() => {
    setType(typeInitial);
    setActifSelectionne(null);
    setRecherche('');
    setQuantite('');
    setPrix('');
  }, [typeInitial]);

  // Recherche par nom ET ticker
  useEffect(() => {
    if (recherche.length < 2) { setResultats([]); return; }

    const chercherLocalement = async () => {
      if (type === 'VENTE') {
        // En mode vente : chercher uniquement dans les positions existantes
        const filtered = positionsExistantes.filter(p =>
          p.symbole.toLowerCase().includes(recherche.toLowerCase()) ||
          (p.nom && p.nom.toLowerCase().includes(recherche.toLowerCase()))
        );
        setResultats(filtered.map(p => ({
          id: p.id,
          ticker: p.symbole,
          nom: p.nom || p.symbole,
          devise: p.devise || 'EUR',
          logo_url: p.logo_url || null,
          quantite_disponible: p.quantite,
          prix_achat_moyen: p.prix_achat_moyen
        })));
      } else {
        // En mode achat : chercher dans le catalogue global
        const { data } = await supabase
          .from('catalogue_actifs')
          .select('*')
          .or(`nom.ilike.%${recherche}%,ticker.ilike.%${recherche}%`)
          .limit(8);
        setResultats(data || []);
      }
    };
    chercherLocalement();
  }, [recherche, type, positionsExistantes]);

  // Sélectionner un actif et récupérer son prix actuel
  const handleSelectActif = async (actif) => {
    setActifSelectionne(actif);
    setResultats([]);
    if (onSelectActif) onSelectActif(actif.id);

    // En mode vente, pré-remplir la quantité max disponible
    if (type === 'VENTE' && actif.quantite_disponible) {
      setQuantite(actif.quantite_disponible.toString());
    }

    // Récupérer le prix actuel depuis le cache
    setLoadingPrix(true);
    try {
      const { data } = await supabase
        .from('cache_des_prix_des_actifs')
        .select('prix')
        .eq('ticker', actif.ticker)
        .single();

      if (data?.prix) {
        setPrix(data.prix.toString());
      } else if (type === 'VENTE' && actif.prix_achat_moyen) {
        // Fallback sur le PRU si pas de prix en cache
        setPrix(actif.prix_achat_moyen.toString());
      }
    } catch (e) {
      // Pas de prix en cache, l'utilisateur saisit manuellement
    }
    setLoadingPrix(false);
  };

  const ajouterNouveauTickerExotique = async () => {
    setLoadingEnrich(true);
    const tickerDemande = recherche.toUpperCase().trim();

    const res = await supabase.functions.invoke('fetch-enrich-asset', {
      body: { ticker: tickerDemande, type: 'ACTION' }
    });

    if (res.data?.success) {
      await handleSelectActif(res.data.asset);
      setResultats([]);
    } else {
      alert("Impossible de trouver ce symbole sur les marchés mondiaux.");
    }
    setLoadingEnrich(false);
  };

  const soumettreTransaction = async (e) => {
    e.preventDefault();
    const { data: userData } = await supabase.auth.getUser();

    // Validation vente : quantité ne peut pas dépasser ce qu'on possède
    if (type === 'VENTE' && actifSelectionne.quantite_disponible) {
      if (parseFloat(quantite) > actifSelectionne.quantite_disponible) {
        alert(`Tu ne peux pas vendre plus que ${actifSelectionne.quantite_disponible} parts.`);
        return;
      }
    }

    const { error } = await supabase.from('transactions_bourse').insert({
      compte_id: compteId,
      actif_id: actifSelectionne.id,
      type_transaction: type,
      quantite: parseFloat(quantite),
      prix_unitaire: parseFloat(prix),
      user_id: userData.user.id
    });

    if (error) {
      alert("Erreur lors de l'enregistrement : " + error.message);
      return;
    }

    if (onTransactionSuccess) onTransactionSuccess();
  };

  // Calcul du montant total en temps réel
  const montantTotal = quantite && prix ? (parseFloat(quantite) * parseFloat(prix)).toFixed(2) : null;

  return (
    <div className="bg-[#0a0f1d] p-6 rounded-2xl border border-slate-800 text-white w-full max-w-md">
      <h3 className="text-xl font-bold mb-4">Enregistrer un ordre</h3>

      {/* Toggle Achat / Vente */}
      <div className="grid grid-cols-2 gap-2 bg-[#161b2c] p-1 rounded-xl mb-4">
        <button
          type="button"
          onClick={() => { setType('ACHAT'); setActifSelectionne(null); setRecherche(''); setPrix(''); setQuantite(''); }}
          className={`py-2 rounded-lg font-semibold transition ${type === 'ACHAT' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-slate-300'}`}
        >
          Achat
        </button>
        <button
          type="button"
          onClick={() => { setType('VENTE'); setActifSelectionne(null); setRecherche(''); setPrix(''); setQuantite(''); }}
          className={`py-2 rounded-lg font-semibold transition ${type === 'VENTE' ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-slate-300'}`}
        >
          Vente
        </button>
      </div>

      {!actifSelectionne ? (
        <div>
          <label className="text-sm text-slate-400">
            {type === 'VENTE' ? 'Chercher dans tes positions' : 'Rechercher une Action ou un ETF'}
          </label>
          <input
            type="text"
            className="w-full bg-[#161b2c] p-3 rounded-xl mt-1 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder={type === 'VENTE' ? 'Ex: AAPL, Apple...' : 'Ex: Apple, LVMH, Amundi...'}
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />

          <div className="mt-2 space-y-1">
            {resultats.map(a => (
              <button
                type="button"
                key={a.id}
                onClick={() => handleSelectActif(a)}
                className="w-full text-left bg-[#1c233a] p-3 rounded-xl flex items-center gap-3 hover:bg-[#252e4c] transition"
              >
                {a.logo_url ? (
                  <img src={a.logo_url} className="w-7 h-7 rounded-full bg-white object-contain" alt="logo" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">
                    {a.ticker?.slice(0, 2)}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold">{a.nom}</p>
                  <p className="text-xs text-slate-400">
                    {a.ticker} • {a.devise}
                    {type === 'VENTE' && a.quantite_disponible && (
                      <span className="ml-2 text-emerald-400">{a.quantite_disponible} parts disponibles</span>
                    )}
                  </p>
                </div>
              </button>
            ))}

            {/* Bouton enrichissement uniquement en mode achat */}
            {type === 'ACHAT' && recherche.length >= 2 && resultats.length === 0 && (
              <button
                type="button"
                onClick={ajouterNouveauTickerExotique}
                className="w-full text-center text-xs text-emerald-400 p-2 border border-dashed border-emerald-500/30 rounded-xl mt-2 hover:bg-emerald-500/10 transition"
              >
                {loadingEnrich ? "Recherche mondiale..." : `Ajouter le ticker "${recherche.toUpperCase()}" via Finnhub`}
              </button>
            )}

            {type === 'VENTE' && recherche.length >= 2 && resultats.length === 0 && (
              <p className="text-xs text-slate-500 text-center mt-2">
                Aucune position trouvée. Tu ne peux vendre que ce que tu possèdes.
              </p>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={soumettreTransaction} className="space-y-4">
          {/* Actif sélectionné */}
          <div className="flex items-center gap-3 bg-[#161b2c] p-3 rounded-xl">
            {actifSelectionne.logo_url ? (
              <img src={actifSelectionne.logo_url} className="w-8 h-8 rounded-full bg-white object-contain" alt="" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">
                {actifSelectionne.ticker?.slice(0, 2)}
              </div>
            )}
            <div>
              <p className="font-bold">{actifSelectionne.nom}</p>
              <p className="text-xs text-slate-400">{actifSelectionne.ticker}</p>
            </div>
            <button
              type="button"
              className="ml-auto text-xs text-red-400 hover:text-red-300"
              onClick={() => { setActifSelectionne(null); setRecherche(''); setPrix(''); setQuantite(''); }}
            >
              Changer
            </button>
          </div>

          {/* Quantité */}
          <div>
            <label className="text-xs text-slate-400">
              Quantité
              {type === 'VENTE' && actifSelectionne.quantite_disponible && (
                <span className="ml-2 text-emerald-400">
                  (max : {actifSelectionne.quantite_disponible})
                </span>
              )}
            </label>
            <input
              type="number"
              step="any"
              min="0"
              required
              className="w-full bg-[#161b2c] p-3 rounded-xl mt-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={quantite}
              onChange={e => setQuantite(e.target.value)}
            />
          </div>

          {/* Prix unitaire */}
          <div>
            <label className="text-xs text-slate-400">
              Prix unitaire ({actifSelectionne.devise})
              {loadingPrix && <span className="ml-2 text-slate-500">Chargement du cours...</span>}
            </label>
            <input
              type="number"
              step="any"
              min="0"
              required
              className="w-full bg-[#161b2c] p-3 rounded-xl mt-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={prix}
              onChange={e => setPrix(e.target.value)}
              placeholder={loadingPrix ? "Récupération du cours..." : "Prix par action"}
            />
          </div>

          {/* Montant total calculé automatiquement */}
          {montantTotal && (
            <div className="bg-[#161b2c] p-3 rounded-xl flex justify-between items-center">
              <span className="text-slate-400 text-sm">Montant total</span>
              <span className="font-bold text-white">
                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: actifSelectionne.devise }).format(montantTotal)}
              </span>
            </div>
          )}

          <button
            type="submit"
            className={`w-full py-3 rounded-xl font-bold mt-2 transition-colors ${type === 'ACHAT' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'
              }`}
          >
            {type === 'ACHAT' ? 'Enregistrer l\'achat' : 'Enregistrer la vente'}
          </button>
        </form>
      )}
    </div>
  );
}