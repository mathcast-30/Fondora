// src/hooks/useFiscaliteGlobale.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  calculerImpotPEA,
  calculerImpotCTO,
  calculerImpotCrypto,
  calculerImpotAV,
  calculerScoreEfficaciteFiscale,
  genererRecommandations,
} from '../utils/fiscalite';
import {
  calculerValeurActuelleContrat,
} from '../lib/financialCalculations';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Garde-fou date : évite new Date(undefined) → Invalid Date → NaN */
function safeDateStr(primary, fallback) {
  if (primary && !Number.isNaN(new Date(primary).getTime())) return primary;
  if (fallback && !Number.isNaN(new Date(fallback).getTime())) return fallback;
  return new Date().toISOString(); // ultime fallback : aujourd'hui
}

/** Fetch cours crypto CoinGecko pour une liste de coin_id */
async function fetchCoursCoinGecko(coinIds) {
  if (!coinIds || coinIds.length === 0) return {};
  try {
    const ids = [...new Set(coinIds)].join(',');
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur`
    );
    if (!res.ok) return {};
    const json = await res.json();
    // { bitcoin: { eur: 60000 }, ... }
    return json;
  } catch {
    return {};
  }
}

// ─── Hook principal ────────────────────────────────────────────────────────────

export function useFiscaliteGlobale() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    async function charger() {
      try {
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Utilisateur non connecté');

        // ── 1. Requêtes parallèles ─────────────────────────────────────────

        const [
          profilRes,
          comptesRes,
          positionsRes,
          prixBourseRes,
          cryptoRes,
          avRes,
          avValosRes,
          avPositionsRes,
        ] = await Promise.all([
          // Profil fiscal
          supabase.from('profiles').select('situation_familiale').eq('id', user.id).single(),

          // Comptes PEA / CTO
          supabase.from('comptes')
            .select('id, nom, type, date_ouverture, created_at')
            .eq('user_id', user.id)
            .in('type', ['PEA', 'CTO']),

          // Positions boursières
          supabase.from('positions_financieres')
            .select('compte_id, symbole, quantite, prix_achat_moyen')
            .eq('user_id', user.id),

          // Cache prix bourse
          supabase.from('asset_prices_cache').select('symbole, prix_actuel'),

          // Crypto
          supabase.from('positions_crypto')
            .select('coin_id, symbole, quantite, prix_achat_moyen')
            .eq('user_id', user.id),

          // Assurances vie
          supabase.from('assurances_vie')
            .select('id, nom, assureur, date_ouverture, total_versements_cumules, frais_gestion_enveloppe')
            .eq('user_id', user.id),

          // Dernières valorisations AV (vue)
          supabase.from('av_valorisation_actuelle').select('*'),

          // Positions UC des AV
          supabase.from('assurances_vie_positions')
            .select('contrat_id, isin, nb_parts, catalogue_actifs(frais_ter_produit)')
            .eq('user_id', user.id),
        ]);

        // ── 2. Normalisation profil ────────────────────────────────────────

        const situationRaw = profilRes.data?.situation_familiale || 'celibataire';
        const situationFamiliale = situationRaw.startsWith('marie') ? 'marie' : 'celibataire';

        // ── 3. Cache prix bourse : symbole → prix_actuel ──────────────────

        const prixBourse = new Map(
          (prixBourseRes.data || []).map(p => [p.symbole, Number(p.prix_actuel)])
        );

        // ── 4. Traitement PEA / CTO ────────────────────────────────────────

        const enveloppesAnalysees = [];
        const comptes = comptesRes.data || [];
        const positions = positionsRes.data || [];

        for (const compte of comptes) {
          const positionsCompte = positions.filter(p => p.compte_id === compte.id);

          // Valeur marché : prix cache ou fallback PRU
          const valeurActuelle = positionsCompte.reduce((sum, p) => {
            const prixMarche = prixBourse.get(p.symbole);
            const prixEffectif = (prixMarche != null && prixMarche > 0)
              ? prixMarche
              : Number(p.prix_achat_moyen);
            return sum + Number(p.quantite) * prixEffectif;
          }, 0);

          // Capital investi = Σ(quantite × PRU) — proxy du capital investi
          const totalInvesti = positionsCompte.reduce(
            (sum, p) => sum + Number(p.quantite) * Number(p.prix_achat_moyen), 0
          );

          // Garde-fou date
          const dateOuverture = safeDateStr(compte.date_ouverture, compte.created_at);

          let resultat;
          if (compte.type === 'PEA') {
            resultat = calculerImpotPEA(valeurActuelle, totalInvesti, dateOuverture);
          } else {
            resultat = calculerImpotCTO(valeurActuelle, totalInvesti);
          }

          enveloppesAnalysees.push({
            typeEnveloppe: compte.type,
            nom: compte.nom,
            valeurActuelle,
            totalVersements: totalInvesti,
            ...resultat,
          });
        }

        // ── 5. Traitement Crypto ───────────────────────────────────────────

        const cryptos = cryptoRes.data || [];
        if (cryptos.length > 0) {
          const coinIds = cryptos.map(c => c.coin_id).filter(Boolean);
          const coursCG = await fetchCoursCoinGecko(coinIds);

          const valeurCryptoTotale = cryptos.reduce((sum, p) => {
            const cours = coursCG[p.coin_id]?.eur;
            const prixEffectif = (cours != null && cours > 0)
              ? cours
              : Number(p.prix_achat_moyen);
            return sum + Number(p.quantite) * prixEffectif;
          }, 0);

          const totalInvestiCrypto = cryptos.reduce(
            (sum, p) => sum + Number(p.quantite) * Number(p.prix_achat_moyen), 0
          );

          if (valeurCryptoTotale > 0 || totalInvestiCrypto > 0) {
            const resultatCrypto = calculerImpotCrypto(valeurCryptoTotale, totalInvestiCrypto);
            enveloppesAnalysees.push({
              typeEnveloppe: 'Crypto',
              nom: 'Portefeuille Crypto',
              valeurActuelle: valeurCryptoTotale,
              totalVersements: totalInvestiCrypto,
              ...resultatCrypto,
            });
          }
        }

        // ── 6. Traitement Assurance Vie ────────────────────────────────────

        const avContrats = avRes.data || [];
        const avValos = avValosRes.data || [];
        const avPositions = avPositionsRes.data || [];

        // Cache prix UC : isin → { dernier_prix }
        // Les UC utilisent asset_prices_cache via isin (déjà chargé via prixBourseRes)
        // On construit un prixCacheUC depuis la même table mais sur isin
        const isinsUC = [...new Set(avPositions.map(p => p.isin).filter(Boolean))];
        let prixCacheUC = {};
        if (isinsUC.length > 0) {
          const { data: prixUCData } = await supabase
            .from('asset_prices_cache')
            .select('isin, dernier_prix')
            .in('isin', isinsUC);
          prixCacheUC = (prixUCData || []).reduce((acc, r) => {
            acc[r.isin] = { dernier_prix: r.dernier_prix };
            return acc;
          }, {});
        }

        const totalPrimesTousContrats = avContrats.reduce(
          (sum, av) => sum + (av.total_versements_cumules || 0), 0
        );

        for (const av of avContrats) {
          const valo = avValos.find(v => v.contrat_id === av.id);
          const valeurFondsEuros = Number(valo?.valeur_fonds_euros) || 0;

          const positionsUC = avPositions
            .filter(p => p.contrat_id === av.id)
            .map(p => ({
              isin: p.isin,
              nb_parts: p.nb_parts,
              frais_ter_produit: p.catalogue_actifs?.frais_ter_produit ?? 0,
            }));

          const { total: valeurActuelle } = calculerValeurActuelleContrat(
            valeurFondsEuros, positionsUC, prixCacheUC
          );

          const dateOuverture = safeDateStr(av.date_ouverture, null);

          const resultat = calculerImpotAV(
            valeurActuelle,
            av.total_versements_cumules || 0,
            dateOuverture,
            situationFamiliale,
            totalPrimesTousContrats
          );

          enveloppesAnalysees.push({
            typeEnveloppe: 'AV',
            nom: av.nom,
            assureur: av.assureur,
            valeurActuelle,
            totalVersements: av.total_versements_cumules || 0,
            ...resultat,
          });
        }

        // ── 7. Score & recommandations ─────────────────────────────────────

        if (enveloppesAnalysees.length === 0) {
          setData({
            enveloppesAnalysees: [],
            score: 100,
            recommandations: [],
            totaux: { valeurBrute: 0, impotLatentTotal: 0, netInPocketTotal: 0, plusValueBruteTotal: 0 },
            situationFamiliale,
            vide: true,
          });
          return;
        }

        const score = calculerScoreEfficaciteFiscale(enveloppesAnalysees);
        const recommandations = genererRecommandations(enveloppesAnalysees, situationFamiliale);

        const totaux = {
          valeurBrute: enveloppesAnalysees.reduce((s, e) => s + e.valeurActuelle, 0),
          impotLatentTotal: enveloppesAnalysees.reduce((s, e) => s + (e.impotLatent || 0), 0),
          netInPocketTotal: enveloppesAnalysees.reduce((s, e) => s + (e.netInPocket || 0), 0),
          plusValueBruteTotal: enveloppesAnalysees.reduce((s, e) => s + (e.plusValueBrute || e.gainBrut || 0), 0),
        };

        setData({ enveloppesAnalysees, score, recommandations, totaux, situationFamiliale, vide: false });

      } catch (err) {
        console.error('[useFiscaliteGlobale]', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    charger();
  }, []);

  return { loading, error, data };
}
