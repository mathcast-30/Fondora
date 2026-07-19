import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function FormulaireAchatVente({ compteId, comptes = [], onTransactionSuccess, onSubmitTransaction, onSelectActif, typeInitial = 'ACHAT', positionsExistantes = [] }) {
  // Comptes investissement filtrés (PEA, CTO)
  const comptesInvest = comptes.filter(c => c.type === 'PEA' || c.type === 'CTO');

  const [recherche, setRecherche] = useState('');
  const [resultats, setResultats] = useState([]);
  const [actifSelectionne, setActifSelectionne] = useState(null);
  const [type, setType] = useState(typeInitial);
  const [quantite, setQuantite] = useState('');
  const [prix, setPrix] = useState('');
  const [dateTransaction, setDateTransaction] = useState(new Date().toISOString().split('T')[0]);
  const [loadingEnrich, setLoadingEnrich] = useState(false);
  const [loadingPrix, setLoadingPrix] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  // Compte sélectionné : priorité au prop compteId, sinon 1er compte invest
  const [compteIdSelectionne, setCompteIdSelectionne] = useState(
    () => compteId || comptesInvest[0]?.id || ''
  );

  // Reset quand typeInitial change (ouverture modal achat vs vente)
  useEffect(() => {
    setType(typeInitial);
    setActifSelectionne(null);
    setRecherche('');
    setQuantite('');
    setPrix('');
    setDateTransaction(new Date().toISOString().split('T')[0]);
  }, [typeInitial]);

  // Recherche par nom ET ticker (uniquement pour ACHAT)
  useEffect(() => {
    if (type === 'VENTE') {
      setResultats([]);
      return;
    }

    if (recherche.length < 2) {
      setResultats([]);
      return;
    }

    const chercherLocalement = async () => {
      const { data } = await supabase
        .from('catalogue_actifs')
        .select('*')
        .or(`nom.ilike.%${recherche}%,ticker.ilike.%${recherche}%`)
        .limit(8);
      setResultats(data || []);
    };
    chercherLocalement();
  }, [recherche, type]);

  // Fetch price when asset or date changes
  useEffect(() => {
    if (!actifSelectionne) return;

    const fetchPrix = async () => {
      setLoadingPrix(true);

      try {
        const { data: histData } = await supabase
          .from('historique_prix_actifs')
          .select('prix_cloture')
          .eq('actif_id', actifSelectionne.id)
          .lte('date', dateTransaction)
          .order('date', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (histData?.prix_cloture) {
          setPrix(histData.prix_cloture.toString());
        } else {
          const today = new Date().toISOString().split('T')[0];
          if (dateTransaction === today) {
            const { data: cacheData } = await supabase
              .from('cache_des_prix_des_actifs')
              .select('prix')
              .eq('ticker', actifSelectionne.ticker)
              .maybeSingle();

            if (cacheData?.prix) {
              setPrix(cacheData.prix.toString());
            } else if (type === 'VENTE' && actifSelectionne.prix_achat_moyen) {
              setPrix(actifSelectionne.prix_achat_moyen.toString());
            } else {
              setPrix('');
            }
          } else {
            setPrix('');
          }
        }
      } catch (e) {
        setPrix('');
      }
      setLoadingPrix(false);
    };

    fetchPrix();
  }, [actifSelectionne, dateTransaction, type]);

  // Sélectionner un actif
  const handleSelectActif = (actif) => {
    setActifSelectionne(actif);
    setResultats([]);
    if (onSelectActif) onSelectActif(actif.id);

    // En mode vente, pré-remplir la quantité max disponible
    if (type === 'VENTE' && actif.quantite_disponible) {
      setQuantite(actif.quantite_disponible.toString());
    }
  };

  const ajouterNouveauTickerExotique = async () => {
    setLoadingEnrich(true);
    const tickerDemande = recherche.toUpperCase().trim();

    const res = await supabase.functions.invoke('fetch-enrich-asset', {
      body: { ticker: tickerDemande, type: 'ACTION' }
    });

    if (res.data?.success) {
      handleSelectActif(res.data.asset);
    } else {
      alert("Impossible de trouver ce symbole sur les marchés mondiaux.");
    }
    setLoadingEnrich(false);
  };

  const soumettreTransaction = async (e) => {
    e.preventDefault();

    if (!compteIdSelectionne) {
      alert("Veuillez sélectionner un compte (PEA ou CTO) avant de valider.");
      return;
    }
    if (!quantite || !prix) {
      alert("Veuillez renseigner la quantité et le prix.");
      return;
    }
    if (!dateTransaction) {
      alert("Veuillez renseigner une date de transaction.");
      return;
    }

    // Construit le payload compatible avec transactions_investissement
    const transactionPayload = {
      symbole: actifSelectionne.ticker,
      type: type === 'ACHAT' ? 'buy' : 'sell',
      quantite: parseFloat(quantite),
      prix_unitaire: parseFloat(prix),
      quantity: parseFloat(quantite),
      price: parseFloat(prix),
      date: dateTransaction,
      actif_id: actifSelectionne.id,
    };

    console.log('Payload envoyé à Supabase :', transactionPayload);

    setLoadingSubmit(true);

    // Validation vente : quantité ne peut pas dépasser ce qu'on possède
    if (type === 'VENTE' && actifSelectionne.quantite_disponible) {
      if (parseFloat(quantite) > actifSelectionne.quantite_disponible) {
        alert(`Tu ne peux pas vendre plus que ${actifSelectionne.quantite_disponible} parts.`);
        setLoadingSubmit(false);
        return;
      }
    }

    let error = null;
    if (onSubmitTransaction) {
      const result = await onSubmitTransaction(transactionPayload);
      error = result?.error;
    } else {
      const { data: userData } = await supabase.auth.getUser();
      const result = await supabase.from('transactions_bourse').insert({
        compte_id: compteIdSelectionne,
        actif_id: actifSelectionne.id,
        type_transaction: type,
        quantite: parseFloat(quantite),
        prix_unitaire: parseFloat(prix),
        date: dateTransaction,
        user_id: userData.user.id,
      });
      error = result.error;
    }

    setLoadingSubmit(false);

    if (error) {
      alert("Erreur lors de l'enregistrement : " + error.message);
      return;
    }

    // Réinitialisation du formulaire
    setActifSelectionne(null);
    setRecherche('');
    setQuantite('');
    setPrix('');
    setDateTransaction(new Date().toISOString().split('T')[0]);

    if (onTransactionSuccess) onTransactionSuccess();
  };

  // Calcul du montant total en temps réel
  const montantTotal = quantite && prix ? (parseFloat(quantite) * parseFloat(prix)).toFixed(2) : null;

  return (
    <div className="bg-[#0a0f1d] p-6 rounded-2xl border border-slate-800 text-white w-full max-w-md">
      <h3 className="text-xl font-bold mb-4">Enregistrer un ordre</h3>

      {/* Sélecteur de compte */}
      {comptesInvest.length > 0 ? (
        <div className="mb-4">
          <label className="text-xs text-slate-400 block mb-1">Compte d'investissement</label>
          <select
            value={compteIdSelectionne}
            onChange={e => setCompteIdSelectionne(e.target.value)}
            className="w-full bg-[#161b2c] p-3 rounded-xl border border-slate-700 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">-- Choisir un compte --</option>
            {comptesInvest.map(c => (
              <option key={c.id} value={c.id}>{c.nom} ({c.type})</option>
            ))}
          </select>
        </div>
      ) : (
        <div className="mb-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-400">
          ⚠️ Aucun compte PEA ou CTO trouvé. Créez-en un dans la section Patrimoine.
        </div>
      )}

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
          {type === 'VENTE' ? (
            <div className="mt-2 space-y-2">
              <label className="text-sm text-slate-400">Sélectionne une position à vendre</label>
              {positionsExistantes.length === 0 ? (
                <p className="text-xs text-slate-500 text-center mt-2">
                  Tu ne possèdes aucune position à vendre.
                </p>
              ) : (
                positionsExistantes.map(p => {
                  const actifVente = {
                    id: p.id,
                    ticker: p.symbole,
                    nom: p.nom || p.symbole,
                    devise: p.devise || 'EUR',
                    logo_url: p.logo_url || null,
                    quantite_disponible: p.quantite,
                    prix_achat_moyen: p.prix_achat_moyen
                  };
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={(e) => { e.preventDefault(); handleSelectActif(actifVente); }}
                      className="w-full text-left bg-[#1c233a] p-3 rounded-xl flex items-center justify-between hover:bg-[#252e4c] transition"
                    >
                      <div className="flex items-center gap-3">
                        {actifVente.logo_url ? (
                          <img src={actifVente.logo_url} className="w-7 h-7 rounded-full bg-white object-contain" alt="logo" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">
                            {actifVente.ticker?.slice(0, 2)}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold">{actifVente.nom}</p>
                          <p className="text-xs text-slate-400">{actifVente.ticker}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-emerald-400">{actifVente.quantite_disponible} dispo.</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          ) : (
            <>
              <label className="text-sm text-slate-400">Rechercher une Action ou un ETF</label>
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
                    onClick={(e) => { e.preventDefault(); handleSelectActif(a); }}
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
                      </p>
                    </div>
                  </button>
                ))}

                {recherche.length >= 2 && resultats.length === 0 && (
                  <button
                    type="button"
                    onClick={ajouterNouveauTickerExotique}
                    className="w-full text-center text-xs text-emerald-400 p-2 border border-dashed border-emerald-500/30 rounded-xl mt-2 hover:bg-emerald-500/10 transition"
                  >
                    {loadingEnrich ? "Recherche mondiale..." : `Ajouter le ticker "${recherche.toUpperCase()}" via Finnhub`}
                  </button>
                )}
              </div>
            </>
          )}
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

          {/* Date de transaction */}
          <div>
            <label className="text-xs text-slate-400">Date de transaction</label>
            <input
              type="date"
              required
              className="w-full bg-[#161b2c] p-3 rounded-xl mt-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={dateTransaction}
              onChange={e => setDateTransaction(e.target.value)}
            />
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
            disabled={loadingSubmit}
            className={`w-full py-3 rounded-xl font-bold mt-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${type === 'ACHAT' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'
              }`}
          >
            {loadingSubmit
              ? 'Enregistrement...'
              : type === 'ACHAT' ? "Enregistrer l'achat" : 'Enregistrer la vente'}
          </button>
        </form>
      )}
    </div>
  );
}