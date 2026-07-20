import React, { useState, useEffect, useContext } from "react";
import { useSupabase } from "../../supabase/SupabaseProvider";
import { ParametresContext } from "../../context/ParametresContext";

const Simulateur = () => {
    const { supabase, user } = useSupabase();
    const { parametres, setParametres } = useContext(ParametresContext);
    const [formData, setFormData] = useState({
        // Objectifs FIRE
        target_number: 1000000,
        age_retraite_cible: 60,
        taux_retrait: 4.0,
        duree_simulation: 50,

        // Paramètres fiscaux globaux
        situation_familiale: "Célibataire",
        fiscalite_regime: "pfu",
        pourcentage_frais_moyen: 0.5,
        inflation_default: 2.0,

        // Scénarios
        scenario_actif: "neutre",
        scenario_optimiste_rendement: 8.0,
        scenario_neutre_rendement: 5.0,
        scenario_neutre_inflation: 2.0,
        scenario_crise_rendement: "-25,-25,-25,-25,0,0,6,6,6,6,6,6,6,6,6",
        scenario_crise_milieu_rendement: "5,5,5,5,5,5,5,5,5,5,-25,-25,-25,-25,0,0,6,6,6,6,6,6,6,6,6",

        // Paramètres par enveloppe
        pea_frais: 0.25,
        pea_fiscalite_avant_5ans: "pfu_31.4",
        pea_fiscalite_apres_5ans: "exonere_ir_ps_18.6",
        cto_frais: 0.5,
        cto_fiscalite: "pfu_31.4",
        av_frais: 0.6,
        av_fiscalite_avant_8ans: "pfu_30",
        av_fiscalite_apres_8ans: "ir_7.5_ps_17.2_abattement_4600",
        av_encours_total: 0,
        per_frais: 0.5,
        per_fiscalite_sortie_capital: "ir_bareme_ps_18.6",
        per_fiscalite_sortie_rente: "ir_abattement_10_ps_18.6",
        immobilier_regime_fiscal: "micro_foncier",
        immobilier_abattement_micro: 30.0,
        immobilier_deficit_foncier_plafond: 10700,
        immobilier_super_deficit_foncier: false,
        immobilier_travaux_energetiques: false,
        lmnp_regime_fiscal: "micro_bic",
        lmnp_abattement_micro: 50.0,
        lmnp_type_meuble: "classique",
        lmnp_recettes_annuelles: 0,

        // Affichage
        afficher_patrimoine_net: true,
        afficher_revenu_passif: true,
        afficher_volatilite: false,
        afficher_age_fire: true,
    });

    // Charger les paramètres existants
    useEffect(() => {
        const fetchParametres = async () => {
            if (!user) return;
            const { data } = await supabase
                .from("parametres_simulateur")
                .select("*")
                .eq("user_id", user.id)
                .single();
            if (data) {
                setFormData(data);
            }
        };
        fetchParametres();
    }, [user]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === "checkbox" ? checked : type === "number" ? parseFloat(value) || 0 : value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await setParametres(formData);
        alert("Paramètres du simulateur mis à jour avec succès !");
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-navy mb-4">Paramètres du Simulateur</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* ===== OBJECTIFS FIRE ===== */}
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <h3 className="text-lg font-medium text-slate-800 mb-4">🎯 Objectifs FIRE</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-navy mb-1">
                                Target Number (€)
                            </label>
                            <input
                                type="number"
                                name="target_number"
                                value={formData.target_number}
                                onChange={handleChange}
                                min="0"
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                Montant cible pour atteindre l'indépendance financière (en euros constants).
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-navy mb-1">
                                Âge de Retraite Cible
                            </label>
                            <input
                                type="number"
                                name="age_retraite_cible"
                                value={formData.age_retraite_cible}
                                onChange={handleChange}
                                min="20"
                                max="100"
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-navy mb-1">
                                Taux de Retrait Annuel (%)
                            </label>
                            <input
                                type="number"
                                name="taux_retrait"
                                value={formData.taux_retrait}
                                onChange={handleChange}
                                step="0.1"
                                min="0"
                                max="10"
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                % du patrimoine à retirer chaque année (ex: 4% pour la règle des 4%).
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-navy mb-1">
                                Durée de Simulation (années)
                            </label>
                            <input
                                type="number"
                                name="duree_simulation"
                                value={formData.duree_simulation}
                                onChange={handleChange}
                                min="1"
                                max="100"
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                    </div>
                </div>

                {/* ===== PARAMÈTRES FISCAUX GLOBAUX ===== */}
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <h3 className="text-lg font-medium text-slate-800 mb-4">⚖️ Paramètres Fiscaux Globaux</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-navy mb-1">
                                Situation Familiale
                            </label>
                            <select
                                name="situation_familiale"
                                value={formData.situation_familiale}
                                onChange={handleChange}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            >
                                <option value="Célibataire">Célibataire</option>
                                <option value="Marié-Pacsé">Marié/Pacsé</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-navy mb-1">
                                Régime Fiscal (Revenus du Capital)
                            </label>
                            <select
                                name="fiscalite_regime"
                                value={formData.fiscalite_regime}
                                onChange={handleChange}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            >
                                <option value="pfu">PFU (Flat Tax)</option>
                                <option value="bareme">Barème Progressif de l'IR</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-navy mb-1">
                                Frais Moyens (%)
                            </label>
                            <input
                                type="number"
                                name="pourcentage_frais_moyen"
                                value={formData.pourcentage_frais_moyen}
                                onChange={handleChange}
                                step="0.01"
                                min="0"
                                max="10"
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                % de frais moyens appliqués aux rendements bruts.
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-navy mb-1">
                                Inflation par Défaut (%)
                            </label>
                            <input
                                type="number"
                                name="inflation_default"
                                value={formData.inflation_default}
                                onChange={handleChange}
                                step="0.01"
                                min="0"
                                max="20"
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                    </div>
                </div>

                {/* ===== SCÉNARIOS ===== */}
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <h3 className="text-lg font-medium text-slate-800 mb-4">📉 Scénarios de Marché</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-navy mb-1">
                                Scénario Actif
                            </label>
                            <select
                                name="scenario_actif"
                                value={formData.scenario_actif}
                                onChange={handleChange}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            >
                                <option value="optimiste">🟢 Optimiste (+8%/an)</option>
                                <option value="neutre">🟡 Neutre (+5%/an, inflation 2%)</option>
                                <option value="crise_debut">🔴 Crise (Début : -25% ans 2-5)</option>
                                <option value="crise_milieu">🔴 Crise (Milieu : -25% ans 15-18)</option>
                                <option value="personnalise">⚙️ Personnalisé</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-navy mb-1">
                                Rendement Scénario Optimiste (%)
                            </label>
                            <input
                                type="number"
                                name="scenario_optimiste_rendement"
                                value={formData.scenario_optimiste_rendement}
                                onChange={handleChange}
                                step="0.1"
                                min="-100"
                                max="100"
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-navy mb-1">
                                Rendement Scénario Neutre (%)
                            </label>
                            <input
                                type="number"
                                name="scenario_neutre_rendement"
                                value={formData.scenario_neutre_rendement}
                                onChange={handleChange}
                                step="0.1"
                                min="-100"
                                max="100"
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-navy mb-1">
                                Inflation Scénario Neutre (%)
                            </label>
                            <input
                                type="number"
                                name="scenario_neutre_inflation"
                                value={formData.scenario_neutre_inflation}
                                onChange={handleChange}
                                step="0.1"
                                min="0"
                                max="20"
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                    </div>
                </div>

                {/* ===== PARAMÈTRES PAR ENVELOPPE ===== */}
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <h3 className="text-lg font-medium text-slate-800 mb-4">📦 Paramètres par Enveloppe</h3>

                    {/* PEA */}
                    <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                        <h4 className="text-md font-medium text-navy mb-2">PEA</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-navy mb-1">
                                    Frais PEA (%)
                                </label>
                                <input
                                    type="number"
                                    name="pea_frais"
                                    value={formData.pea_frais}
                                    onChange={handleChange}
                                    step="0.01"
                                    min="0"
                                    max="5"
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-navy mb-1">
                                    Fiscalité avant 5 ans
                                </label>
                                <select
                                    name="pea_fiscalite_avant_5ans"
                                    value={formData.pea_fiscalite_avant_5ans}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                >
                                    <option value="pfu_31.4">PFU 31.4% (12.8% IR + 18.6% PS)</option>
                                    <option value="bareme">Barème Progressif de l'IR</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Assurance-Vie */}
                    <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                        <h4 className="text-md font-medium text-navy mb-2">Assurance-Vie</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-navy mb-1">
                                    Frais AV (%)
                                </label>
                                <input
                                    type="number"
                                    name="av_frais"
                                    value={formData.av_frais}
                                    onChange={handleChange}
                                    step="0.01"
                                    min="0"
                                    max="5"
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-navy mb-1">
                                    Fiscalité avant 8 ans
                                </label>
                                <select
                                    name="av_fiscalite_avant_8ans"
                                    value={formData.av_fiscalite_avant_8ans}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                >
                                    <option value="pfu_30">PFU 30% (12.8% IR + 17.2% PS)</option>
                                    <option value="bareme">Barème Progressif de l'IR</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-navy mb-1">
                                    Fiscalité après 8 ans
                                </label>
                                <select
                                    name="av_fiscalite_apres_8ans"
                                    value={formData.av_fiscalite_apres_8ans}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                >
                                    <option value="ir_7.5_ps_17.2_abattement_4600">IR 7.5% + PS 17.2% (abattement 4 600€)</option>
                                    <option value="ir_12.8_ps_17.2_abattement_4600">IR 12.8% + PS 17.2% (abattement 4 600€)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-navy mb-1">
                                    Encours Total AV (€)
                                </label>
                                <input
                                    type="number"
                                    name="av_encours_total"
                                    value={formData.av_encours_total}
                                    onChange={handleChange}
                                    min="0"
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    Pour calculer le seuil des 150 000 € (taux réduit après 8 ans).
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Immobilier (Location Nue) */}
                    <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                        <h4 className="text-md font-medium text-navy mb-2">Immobilier (Location Nue)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-navy mb-1">
                                    Régime Fiscal
                                </label>
                                <select
                                    name="immobilier_regime_fiscal"
                                    value={formData.immobilier_regime_fiscal}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                >
                                    <option value="micro_foncier">Micro-Foncier (abattement 30%)</option>
                                    <option value="reel">Réel (déduction charges réelles)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-navy mb-1">
                                    Plafond Déficit Foncier (€)
                                </label>
                                <input
                                    type="number"
                                    name="immobilier_deficit_foncier_plafond"
                                    value={formData.immobilier_deficit_foncier_plafond}
                                    onChange={handleChange}
                                    min="0"
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="immobilier_super_deficit_foncier"
                                        checked={formData.immobilier_super_deficit_foncier}
                                        onChange={handleChange}
                                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-navy">
                                        Éligible au "Super Déficit Foncier" (21 400 €, travaux énergétiques)
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== BOUTONS ===== */}
                <div className="flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => {
                            // Réinitialiser aux valeurs par défaut
                            setFormData({
                                target_number: 1000000,
                                age_retraite_cible: 60,
                                taux_retrait: 4.0,
                                duree_simulation: 50,
                                situation_familiale: "Célibataire",
                                fiscalite_regime: "pfu",
                                pourcentage_frais_moyen: 0.5,
                                inflation_default: 2.0,
                                scenario_actif: "neutre",
                                scenario_optimiste_rendement: 8.0,
                                scenario_neutre_rendement: 5.0,
                                scenario_neutre_inflation: 2.0,
                                scenario_crise_rendement: "-25,-25,-25,-25,0,0,6,6,6,6,6,6,6,6,6",
                                scenario_crise_milieu_rendement: "5,5,5,5,5,5,5,5,5,5,-25,-25,-25,-25,0,0,6,6,6,6,6,6,6,6,6",
                                pea_frais: 0.25,
                                pea_fiscalite_avant_5ans: "pfu_31.4",
                                pea_fiscalite_apres_5ans: "exonere_ir_ps_18.6",
                                cto_frais: 0.5,
                                cto_fiscalite: "pfu_31.4",
                                av_frais: 0.6,
                                av_fiscalite_avant_8ans: "pfu_30",
                                av_fiscalite_apres_8ans: "ir_7.5_ps_17.2_abattement_4600",
                                av_encours_total: 0,
                                per_frais: 0.5,
                                per_fiscalite_sortie_capital: "ir_bareme_ps_18.6",
                                per_fiscalite_sortie_rente: "ir_abattement_10_ps_18.6",
                                immobilier_regime_fiscal: "micro_foncier",
                                immobilier_abattement_micro: 30.0,
                                immobilier_deficit_foncier_plafond: 10700,
                                immobilier_super_deficit_foncier: false,
                                immobilier_travaux_energetiques: false,
                                lmnp_regime_fiscal: "micro_bic",
                                lmnp_abattement_micro: 50.0,
                                lmnp_type_meuble: "classique",
                                lmnp_recettes_annuelles: 0,
                                afficher_patrimoine_net: true,
                                afficher_revenu_passif: true,
                                afficher_volatilite: false,
                                afficher_age_fire: true,
                            });
                        }}
                        className="px-4 py-2 bg-slate-200 text-navy rounded-lg hover:bg-slate-300 transition"
                    >
                        Réinitialiser
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-emerald text-white rounded-lg hover:bg-emerald-600 transition"
                    >
                        Sauvegarder les Paramètres
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Simulateur;