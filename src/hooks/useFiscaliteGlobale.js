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

export function useFiscaliteGlobale() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    async function charger() {
      try {
        setLoading(true);

        // 1. Profil fiscal de l'utilisateur
        const { data: { user } } = await supabase.auth.getUser();
        const { data: profil } = await supabase
          .from('profiles')
          .select('situation_familiale')
          .eq('id', user.id)
          .single();

        const situationFamiliale = profil?.situation_familiale || 'celibataire';

        // 2. Comptes investissement (PEA + CTO)
        const { data: comptes } = await supabase
          .from('comptes_investissement')
          .select(`
            id, nom, type, date_ouverture, total_versements_cumules,
            positions_investissement (
              valeur_actuelle, prix_achat_moyen, quantite
            )
          `)
          .eq('user_id', user.id);

        // 3. Crypto positions
        const { data: cryptos } = await supabase
          .from('positions_investissement')
          .select('nom, valeur_actuelle, prix_achat_moyen, quantite')
          .eq('user_id', user.id)
          .is('compte_invest_id', null); // positions sans compte = crypto

        // 4. Assurances vie
        const { data: assurancesVie } = await supabase
          .from('assurances_vie')
          .select(`
            id, nom, assureur, date_ouverture, total_versements_cumules,
            assurances_vie_valorisations (valeur, date)
          `)
          .eq('user_id', user.id);

        // --- Traitement PEA / CTO ---
        const enveloppesAnalysees = [];

        (comptes || []).forEach((compte) => {
          const valeurActuelle = compte.positions_investissement
            .reduce((sum, p) => sum + (p.valeur_actuelle * (p.quantite || 1)), 0);
          const totalVersements = compte.total_versements_cumules || 0;

          let resultat;
          if (compte.type === 'PEA') {
            resultat = calculerImpotPEA(valeurActuelle, totalVersements, compte.date_ouverture);
          } else {
            resultat = calculerImpotCTO(valeurActuelle, totalVersements);
          }

          enveloppesAnalysees.push({
            typeEnveloppe: compte.type,
            nom: compte.nom,
            valeurActuelle,
            totalVersements,
            ...resultat,
          });
        });

        // --- Traitement Crypto ---
        const valeurCryptoTotale = (cryptos || []).reduce(
          (sum, p) => sum + (p.valeur_actuelle * (p.quantite || 1)), 0
        );
        const prixAchatCryptoTotal = (cryptos || []).reduce(
          (sum, p) => sum + (p.prix_achat_moyen * (p.quantite || 1)), 0
        );

        if (valeurCryptoTotale > 0) {
          const resultatCrypto = calculerImpotCrypto(valeurCryptoTotale, prixAchatCryptoTotal);
          enveloppesAnalysees.push({
            typeEnveloppe: 'Crypto',
            nom: 'Portefeuille Crypto',
            valeurActuelle: valeurCryptoTotale,
            totalVersements: prixAchatCryptoTotal,
            ...resultatCrypto,
          });
        }

        // --- Traitement Assurance Vie ---
        const totalPrimesTousContrats = (assurancesVie || [])
          .reduce((sum, av) => sum + (av.total_versements_cumules || 0), 0);

        (assurancesVie || []).forEach((av) => {
          // Prendre la dernière valorisation connue
          const valorisations = av.assurances_vie_valorisations || [];
          const derniereValo = valorisations.sort((a, b) =>
            new Date(b.date) - new Date(a.date)
          )[0];
          const valeurActuelle = derniereValo?.valeur || 0;

          const resultat = calculerImpotAV(
            valeurActuelle,
            av.total_versements_cumules || 0,
            av.date_ouverture,
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
        });

        // --- Score global ---
        const score = calculerScoreEfficaciteFiscale(enveloppesAnalysees);
        const recommandations = genererRecommandations(enveloppesAnalysees, situationFamiliale);

        const totaux = {
          valeurBrute: enveloppesAnalysees.reduce((s, e) => s + e.valeurActuelle, 0),
          impotLatentTotal: enveloppesAnalysees.reduce((s, e) => s + (e.impotLatent || 0), 0),
          netInPocketTotal: enveloppesAnalysees.reduce((s, e) => s + (e.netInPocket || 0), 0),
          plusValueBruteTotal: enveloppesAnalysees.reduce((s, e) => s + (e.plusValueBrute || 0), 0),
        };

        setData({ enveloppesAnalysees, score, recommandations, totaux, situationFamiliale });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    charger();
  }, []);

  return { loading, error, data };
}
