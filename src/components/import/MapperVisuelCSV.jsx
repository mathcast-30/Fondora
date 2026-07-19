import React, { useState, useEffect } from 'react';

/**
 * MapperVisuelCSV
 * Composant de secours permettant à l'utilisateur d'associer manuellement 
 * chaque colonne d'un fichier CSV inconnu aux champs standardisés de l'application.
 *
 * Props :
 * @param {string[]} headers - En-têtes bruts du fichier CSV.
 * @param {string[][]} lignesApercu - 3 à 5 premières lignes du fichier CSV pour aperçu.
 * @param {function} onMappingValide - Callback appelé avec { colonnes, nomTemplate } lors de la validation.
 * @param {function} onAnnuler - Callback appelé lors de l'annulation.
 */
export default function MapperVisuelCSV({
  headers = [],
  lignesApercu = [],
  onMappingValide,
  onAnnuler
}) {
  // Mapping local : clé = index de colonne (string ou nombre), valeur = type de champ sélectionné
  const [mapping, setMapping] = useState({});
  const [sauvegarderFormat, setSauvegarderFormat] = useState(false);
  const [nomFormat, setNomFormat] = useState('');
  const [validationMessage, setValidationMessage] = useState('');
  const [isValid, setIsValid] = useState(false);

  // Initialisation par défaut : toutes les colonnes sur 'ignorer'
  useEffect(() => {
    if (headers && headers.length > 0) {
      const initialMapping = {};
      headers.forEach((_, idx) => {
        initialMapping[idx] = 'ignorer';
      });
      setMapping(initialMapping);
    }
  }, [headers]);

  // Validation dynamique du mapping sélectionné
  useEffect(() => {
    const valeurs = Object.values(mapping);

    const aDate = valeurs.includes('date');
    const aDescription = valeurs.includes('description');
    const aMontant = valeurs.includes('montant');
    const aDebit = valeurs.includes('debit');
    const aCredit = valeurs.includes('credit');

    // Une date ET (un montant OU (débit ET crédit)) ET une description
    const conditionsChampsRemplies = aDate && aDescription && (aMontant || (aDebit && aCredit));

    // Si la sauvegarde du format est cochée, le nom de format doit être saisi
    const nomRempliSiRequis = !sauvegarderFormat || (nomFormat && nomFormat.trim().length > 0);

    const complet = conditionsChampsRemplies && nomRempliSiRequis;
    setIsValid(complet);

    // Construction d'un message d'erreur d'accompagnement
    if (!conditionsChampsRemplies) {
      const requisManquants = [];
      if (!aDate) requisManquants.push("date 📅");
      if (!aDescription) requisManquants.push("description / libellé 📝");
      if (!aMontant && !(aDebit && aCredit)) {
        requisManquants.push("montant unique 💰 ou les deux colonnes débit/crédit 💰");
      }
      setValidationMessage(
        `Champs requis manquants : ${requisManquants.join(', ')}`
      );
    } else if (sauvegarderFormat && (!nomFormat || !nomFormat.trim())) {
      setValidationMessage("Veuillez saisir un nom pour ce format d'import");
    } else {
      setValidationMessage('');
    }
  }, [mapping, sauvegarderFormat, nomFormat]);

  const handleSelectChange = (colIdx, value) => {
    setMapping(prev => ({
      ...prev,
      [colIdx]: value
    }));
  };

  const handleValider = (e) => {
    e.preventDefault();
    if (!isValid) return;

    if (onMappingValide) {
      onMappingValide({
        colonnes: mapping,
        nomTemplate: sauvegarderFormat ? nomFormat.trim() : null
      });
    }
  };

  return (
    <div className="bg-[#0a0f1d] border border-slate-800 rounded-2xl p-6 text-slate-200 w-full max-w-5xl mx-auto shadow-xl">
      {/* En-tête */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white mb-2">
          Format de fichier non reconnu — Configurez le mapping
        </h2>
        <p className="text-slate-400 text-sm">
          Associez chaque colonne de votre fichier à un champ Fondora pour nous permettre de lire correctement vos données.
        </p>
      </div>

      {/* Aperçu et sélection des correspondances */}
      <form onSubmit={handleValider} className="space-y-6">
        <div className="overflow-x-auto border border-slate-800 rounded-xl bg-[#0e1424]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-[#0d1222]">
                {headers.map((header, colIdx) => (
                  <th key={colIdx} className="p-4 align-top min-w-[200px] border-r border-slate-800 last:border-r-0">
                    <div className="flex flex-col space-y-2">
                      <span className="text-xs text-slate-400 uppercase font-medium truncate block title={header}">
                        {header || `Colonne ${colIdx + 1}`}
                      </span>
                      
                      <select
                        value={mapping[colIdx] || 'ignorer'}
                        onChange={(e) => handleSelectChange(colIdx, e.target.value)}
                        className="bg-[#161b2c] border border-slate-700 rounded-lg text-slate-200 text-xs p-2.5 w-full focus:outline-none focus:border-indigo-500 transition-colors"
                      >
                        <option value="ignorer">— Ignorer —</option>
                        <option value="date">📅 Date</option>
                        <option value="description">📝 Description / Libellé</option>
                        <option value="montant">💰 Montant (signé)</option>
                        <option value="debit">💰 Débit</option>
                        <option value="credit">💰 Crédit</option>
                        <option value="categorie">📂 Catégorie (optionnel)</option>
                      </select>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lignesApercu.map((ligne, rowIdx) => (
                <tr key={rowIdx} className="border-b border-slate-800 last:border-b-0 hover:bg-[#12182c] transition-colors">
                  {headers.map((_, colIdx) => {
                    const cellule = ligne[colIdx] !== undefined ? String(ligne[colIdx]) : '';
                    return (
                      <td key={colIdx} className="p-3 text-xs text-slate-300 border-r border-slate-800 last:border-r-0 truncate max-w-[200px]" title={cellule}>
                        {cellule || <span className="text-slate-600 italic">Vide</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section Sauvegarde de template / Nom du template */}
        <div className="bg-[#0e1424] border border-slate-800 rounded-xl p-4 space-y-4">
          <label className="flex items-center space-x-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={sauvegarderFormat}
              onChange={(e) => setSauvegarderFormat(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 border-slate-700 bg-[#161b2c] accent-emerald-500"
            />
            <span className="text-sm text-slate-300">
              Sauvegarder ce format d'import pour mes futurs fichiers
            </span>
          </label>

          {sauvegarderFormat && (
            <div className="flex flex-col space-y-1.5 max-w-md animate-fadeIn">
              <span className="text-xs text-slate-400 font-medium">Nom du format</span>
              <input
                type="text"
                placeholder="ex: Mon compte Crédit Mutuel"
                value={nomFormat}
                onChange={(e) => setNomFormat(e.target.value)}
                className="bg-[#161b2c] border border-slate-700 rounded-lg text-slate-200 text-sm px-3 py-2 w-full focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                required={sauvegarderFormat}
              />
            </div>
          )}
        </div>

        {/* Pied de formulaire avec validation et annulation */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="w-full sm:w-auto">
            {validationMessage && (
              <p className="text-amber-500 text-xs bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-500/20">
                ⚠️ {validationMessage}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onAnnuler}
              className="px-4 py-2 text-sm font-medium text-slate-400 bg-transparent hover:text-slate-200 transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className={`px-5 py-2 text-sm font-semibold rounded-xl text-white shadow-md transition-all cursor-pointer ${
                isValid
                  ? 'bg-emerald-500 hover:bg-emerald-600 hover:scale-[1.02]'
                  : 'bg-slate-800 opacity-50 cursor-not-allowed'
              }`}
            >
              Valider le mapping
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
