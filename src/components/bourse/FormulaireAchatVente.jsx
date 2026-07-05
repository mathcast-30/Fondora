import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function FormulaireAchatVente({ compteId, onTransactionSuccess, onSelectActif }) {
  const [recherche, setRecherche] = useState('');
  const [resultats, setResultats] = useState([]);
  const [actifSelectionne, setActifSelectionneLocal] = useState(null);
  const [type, setType] = useState('ACHAT'); // ACHAT ou VENTE
  const [quantite, setQuantite] = useState('');
  const [prix, setPrix] = useState('');
  const [loadingEnrich, setLoadingEnrich] = useState(false);

  useEffect(() => {
    if (recherche.length < 2) { setResultats([]); return; }
    
    const chercherLocalement = async () => {
      const { data } = await supabase
        .from('catalogue_actifs')
        .select('*')
        .ilike('nom', `%${recherche}%`)
        .limit(5);
      setResultats(data || []);
    };
    chercherLocalement();
  }, [recherche]);

  const ajouterNouveauTickerExotique = async () => {
    setLoadingEnrich(true);
    const tickerDemande = recherche.toUpperCase().trim();
    
    const res = await supabase.functions.invoke('fetch-enrich-asset', {
      body: { ticker: tickerDemande, type: 'ACTION' }
    });

    const setActifSelectionne = (actif) => {
        setActifSelectionneLocal(actif);
        if (onSelectActif) onSelectActif(actif?.id || null);
    };

    if (res.data?.success) {
      setActifSelectionne(res.data.asset);
      setResultats([]);
    } else {
      alert("Impossible de trouver ce symbole sur les marchés mondiaux.");
    }
    setLoadingEnrich(false);
  };

  const soumettreTransaction = async (e) => {
    e.preventDefault();
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from('transactions_bourse').insert({
      compte_id: compteId,
      actif_id: actifSelectionne.id,
      type_transaction: type,
      quantite: parseFloat(quantite),
      prix_unitaire: parseFloat(prix),
      user_id: userData.user.id
    });
    if (onTransactionSuccess) onTransactionSuccess();
  };

  return (
    <div className="bg-[#0a0f1d] p-6 rounded-2xl border border-slate-800 text-white w-full max-w-md">
      <h3 className="text-xl font-bold mb-4">Enregistrer un ordre</h3>
      
      {!actifSelectionne ? (
        <div>
          <label className="text-sm text-slate-400">Rechercher une Action ou un ETF (Top 1000)</label>
          <input 
            type="text" 
            className="w-full bg-[#161b2c] p-3 rounded-xl mt-1 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Ex: Apple, LVMH, Amundi..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
          <div className="mt-2 space-y-1">
            {resultats.map(a => (
              <button 
                type="button"
                key={a.id} 
                onClick={() => setActifSelectionne(a)}
                className="w-full text-left bg-[#1c233a] p-3 rounded-xl flex items-center gap-3 hover:bg-[#252e4c] transition"
              >
                <img src={a.logo_url} className="w-7 h-7 rounded-full bg-white object-contain" alt="logo" />
                <div>
                  <p className="font-semibold">{a.nom}</p>
                  <p className="text-xs text-slate-400">{a.ticker} • {a.devise}</p>
                </div>
              </button>
            ))}
            {recherche.length >= 2 && (
              <button 
                type="button"
                onClick={ajouterNouveauTickerExotique}
                className="w-full text-center text-xs text-emerald-400 p-2 border border-dashed border-emerald-500/30 rounded-xl mt-2 hover:bg-emerald-500/10 transition"
              >
                {loadingEnrich ? "Recherche mondiale..." : `Ajouter forcement le Ticker "${recherche.toUpperCase()}" via Finnhub`}
              </button>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={soumettreTransaction} className="space-y-4">
          <div className="flex items-center gap-3 bg-[#161b2c] p-3 rounded-xl">
            <img src={actifSelectionne.logo_url} className="w-8 h-8 rounded-full bg-white object-contain" alt="" />
            <div>
              <p className="font-bold">{actifSelectionne.nom}</p>
              <p className="text-xs text-slate-400">{actifSelectionne.ticker}</p>
            </div>
            <button type="button" className="ml-auto text-xs text-red-400 hover:text-red-300" onClick={() => setActifSelectionne(null)}>Changer</button>
          </div>

          <div className="grid grid-cols-2 gap-2 bg-[#161b2c] p-1 rounded-xl">
            <button type="button" onClick={() => setType('ACHAT')} className={`py-2 rounded-lg font-semibold transition ${type === 'ACHAT' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-slate-300'}`}>Achat</button>
            <button type="button" onClick={() => setType('VENTE')} className={`py-2 rounded-lg font-semibold transition ${type === 'VENTE' ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-slate-300'}`}>Vente</button>
          </div>

          <div>
            <label className="text-xs text-slate-400">Quantité</label>
            <input type="number" step="any" required className="w-full bg-[#161b2c] p-3 rounded-xl mt-1 focus:outline-none focus:ring-1 focus:ring-indigo-500" value={quantite} onChange={e => setQuantite(e.target.value)} />
          </div>

          <div>
            <label className="text-xs text-slate-400">Prix unitaire ({actifSelectionne.devise})</label>
            <input type="number" step="any" required className="w-full bg-[#161b2c] p-3 rounded-xl mt-1 focus:outline-none focus:ring-1 focus:ring-indigo-500" value={prix} onChange={e => setPrix(e.target.value)} />
          </div>

          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl font-bold mt-2 transition-colors">
            Enregistrer l'opération
          </button>
        </form>
      )}
    </div>
  );
}
