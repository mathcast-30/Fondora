import { Link } from 'react-router-dom'

export default function PolitiqueConfidentialite() {
    return (
        <div style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }} className="min-h-screen py-12 px-6">
            <div className="max-w-3xl mx-auto">
                <Link to="/" className="text-emerald hover:underline text-sm font-medium flex items-center gap-2 mb-8">
                    ← Retour à l'application
                </Link>
                <h1 className="text-3xl font-bold mb-2">Politique de Confidentialité</h1>
                <p className="text-gray-400 text-sm mb-6">Version 1.0 — En vigueur depuis le 13 juillet 2026</p>
                <hr className="border-navy-light mb-8" style={{ borderColor: 'var(--border-color)' }} />
                
                <div className="space-y-8 text-gray-300 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">1. Responsable du traitement</h2>
                        <p className="mt-2 font-medium text-white">
                            Mathéo Hélou<br />
                            Particulier — Éditeur de Fondora<br />
                            Contact : fondora.dev@gmail.com
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">2. Données collectées</h2>
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-medium text-white mb-1">2.1 Données d'inscription</h3>
                                <ul className="list-disc pl-6 space-y-1">
                                    <li>Adresse email</li>
                                    <li>Mot de passe (stocké sous forme chiffrée par Supabase Auth — jamais accessible en clair)</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-white mb-1">2.2 Données de profil (saisies volontairement)</h3>
                                <ul className="list-disc pl-6 space-y-1">
                                    <li>Prénom / nom d'affichage</li>
                                    <li>Situation familiale (célibataire, marié/pacsé)</li>
                                    <li>Objectif patrimonial principal</li>
                                    <li>Devise de référence</li>
                                    <li>Préférences de modules actifs</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-white mb-1">2.3 Données financières personnelles (saisies volontairement)</h3>
                                <ul className="list-disc pl-6 space-y-1">
                                    <li>Comptes bancaires et soldes</li>
                                    <li>Transactions et catégories de dépenses</li>
                                    <li>Budgets mensuels</li>
                                    <li>Positions d'investissement (actions, ETF, crypto, assurance-vie)</li>
                                    <li>Biens immobiliers et dettes associées</li>
                                    <li>Actifs tangibles et leur valorisation estimée</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-white mb-1">2.4 Données techniques</h3>
                                <ul className="list-disc pl-6 space-y-1">
                                    <li>Logs de connexion (horodatage, adresse IP) gérés par Supabase Auth</li>
                                    <li>Consentements RGPD (type, version, date d'acceptation)</li>
                                    <li>Notifications in-app (générées automatiquement par l'application)</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-white mb-1">2.5 Données NON collectées</h3>
                                <p>Fondora ne collecte <strong>pas</strong> :</p>
                                <ul className="list-disc pl-6 space-y-1">
                                    <li>De cookies de tracking ou publicitaires</li>
                                    <li>De données de navigation entre pages</li>
                                    <li>D'informations issues de tiers (banques, courtiers, etc.)</li>
                                    <li>De données de localisation</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">3. Finalités et bases légales du traitement</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full border-collapse border border-navy-light text-left text-sm">
                                <thead>
                                    <tr className="bg-navy-light text-white">
                                        <th className="border border-navy-light p-3">Finalité</th>
                                        <th className="border border-navy-light p-3">Base légale</th>
                                        <th className="border border-navy-light p-3">Durée de conservation</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="border border-navy-light p-3">Fourniture du service (authentification, affichage des données)</td>
                                        <td className="border border-navy-light p-3">Exécution du contrat (Art. 6.1.b RGPD)</td>
                                        <td className="border border-navy-light p-3">Durée du compte + 30 jours après suppression</td>
                                    </tr>
                                    <tr className="bg-navy-light/20">
                                        <td className="border border-navy-light p-3">Calculs financiers et projections</td>
                                        <td className="border border-navy-light p-3">Exécution du contrat (Art. 6.1.b RGPD)</td>
                                        <td className="border border-navy-light p-3">Durée du compte</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-navy-light p-3">Traçabilité des consentements</td>
                                        <td className="border border-navy-light p-3">Obligation légale (Art. 6.1.c RGPD)</td>
                                        <td className="border border-navy-light p-3">5 ans après le consentement</td>
                                    </tr>
                                    <tr className="bg-navy-light/20">
                                        <td className="border border-navy-light p-3">Notifications in-app</td>
                                        <td className="border border-navy-light p-3">Intérêt légitime (Art. 6.1.f RGPD)</td>
                                        <td className="border border-navy-light p-3">90 jours glissants</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-navy-light p-3">Amélioration du service (logs techniques)</td>
                                        <td className="border border-navy-light p-3">Intérêt légitime (Art. 6.1.f RGPD)</td>
                                        <td className="border border-navy-light p-3">30 jours</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">4. Sous-traitants</h2>
                        <p className="mb-3">Fondora utilise les sous-traitants suivants, tous conformes au RGPD :</p>
                        <div className="overflow-x-auto">
                            <table className="min-w-full border-collapse border border-navy-light text-left text-sm">
                                <thead>
                                    <tr className="bg-navy-light text-white">
                                        <th className="border border-navy-light p-3">Sous-traitant</th>
                                        <th className="border border-navy-light p-3">Rôle</th>
                                        <th className="border border-navy-light p-3">Localisation des données</th>
                                        <th className="border border-navy-light p-3">Garanties</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="border border-navy-light p-3"><strong>Supabase</strong></td>
                                        <td className="border border-navy-light p-3">Base de données, authentification</td>
                                        <td className="border border-navy-light p-3">eu-west-3 (Paris, France)</td>
                                        <td className="border border-navy-light p-3">DPA disponible sur supabase.com/privacy</td>
                                    </tr>
                                    <tr className="bg-navy-light/20">
                                        <td className="border border-navy-light p-3"><strong>Vercel</strong></td>
                                        <td className="border border-navy-light p-3">Hébergement de l'application front-end</td>
                                        <td className="border border-navy-light p-3">Réseau CDN mondial (edge)</td>
                                        <td className="border border-navy-light p-3">DPA disponible sur vercel.com/legal/privacy-policy</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p className="mt-3">Aucune donnée n'est vendue, partagée ou transmise à des tiers à des fins commerciales ou publicitaires.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">5. Cookies</h2>
                        <h3 className="text-lg font-medium text-white mb-2">Cookies essentiels (exemptés de consentement)</h3>
                        <p className="mb-3">Fondora utilise uniquement des cookies techniques indispensables au fonctionnement du service :</p>
                        <div className="overflow-x-auto">
                            <table className="min-w-full border-collapse border border-navy-light text-left text-sm">
                                <thead>
                                    <tr className="bg-navy-light text-white">
                                        <th className="border border-navy-light p-3">Cookie</th>
                                        <th className="border border-navy-light p-3">Finalité</th>
                                        <th className="border border-navy-light p-3">Durée</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="border border-navy-light p-3">`sb-access-token`</td>
                                        <td className="border border-navy-light p-3">Session d'authentification Supabase</td>
                                        <td className="border border-navy-light p-3">Session / 1 heure</td>
                                    </tr>
                                    <tr className="bg-navy-light/20">
                                        <td className="border border-navy-light p-3">`sb-refresh-token`</td>
                                        <td className="border border-navy-light p-3">Renouvellement automatique de session</td>
                                        <td className="border border-navy-light p-3">7 jours</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p className="mt-3 font-medium text-white">Ces cookies sont nécessaires à la connexion et ne peuvent pas être désactivés sans empêcher l'accès au service.</p>
                        
                        <h3 className="text-lg font-medium text-white mt-4 mb-2">Cookies tiers</h3>
                        <p>Fondora ne dépose <strong>aucun cookie publicitaire, analytique ou de tracking tiers</strong> à ce jour.</p>
                        <p className="mt-2">Si des outils d'analyse devaient être ajoutés à l'avenir, la présente politique serait mise à jour et un nouveau consentement vous serait demandé.</p>
                    </section>

                    <section id="droits">
                        <h2 className="text-xl font-semibold text-white mb-3">6. Vos droits (RGPD)</h2>
                        <p className="mb-3">Conformément aux articles 15 à 22 du Règlement Général sur la Protection des Données, vous disposez des droits suivants :</p>
                        <div className="overflow-x-auto">
                            <table className="min-w-full border-collapse border border-navy-light text-left text-sm">
                                <thead>
                                    <tr className="bg-navy-light text-white">
                                        <th className="border border-navy-light p-3">Droit</th>
                                        <th className="border border-navy-light p-3">Comment l'exercer</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="border border-navy-light p-3"><strong>Droit d'accès</strong> (Art. 15)</td>
                                        <td className="border border-navy-light p-3">Page Paramètres → Export de mes données</td>
                                    </tr>
                                    <tr className="bg-navy-light/20">
                                        <td className="border border-navy-light p-3"><strong>Droit de rectification</strong> (Art. 16)</td>
                                        <td className="border border-navy-light p-3">Page Paramètres → Profil</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-navy-light p-3"><strong>Droit à l'effacement</strong> (Art. 17)</td>
                                        <td className="border border-navy-light p-3">Page Paramètres → Compte → Supprimer mon compte</td>
                                    </tr>
                                    <tr className="bg-navy-light/20">
                                        <td className="border border-navy-light p-3"><strong>Droit à la portabilité</strong> (Art. 20)</td>
                                        <td className="border border-navy-light p-3">Page Paramètres → Export de mes données (format JSON/CSV)</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-navy-light p-3"><strong>Droit d'opposition</strong> (Art. 21)</td>
                                        <td className="border border-navy-light p-3">Contact : fondora.dev@gmail.com</td>
                                    </tr>
                                    <tr className="bg-navy-light/20">
                                        <td className="border border-navy-light p-3"><strong>Droit à la limitation</strong> (Art. 18)</td>
                                        <td className="border border-navy-light p-3">Contact : fondora.dev@gmail.com</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p className="mt-3">Toute demande sera traitée dans un délai maximum de <strong>30 jours</strong>.</p>
                        <p className="mt-2">Vous disposez également du droit d'introduire une réclamation auprès de la <strong>CNIL</strong> (Commission Nationale de l'Informatique et des Libertés) : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-emerald hover:underline">www.cnil.fr</a></p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">7. Sécurité</h2>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>Chiffrement de toutes les communications (HTTPS/TLS)</li>
                            <li>Authentification sécurisée via Supabase Auth (bcrypt)</li>
                            <li>Isolation des données par utilisateur via Row Level Security (RLS) PostgreSQL</li>
                            <li>Aucun accès des équipes de Fondora aux données financières des utilisateurs</li>
                            <li>Suppression en cascade de toutes les données lors de la clôture du compte</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">8. Transferts hors UE</h2>
                        <p>
                            Les données sont hébergées en France (Supabase, région eu-west-3). L'application front-end est distribuée via le réseau CDN de Vercel, dont certains nœuds sont situés hors de l'Union Européenne. Ces transferts sont encadrés par les Clauses Contractuelles Types (CCT) de la Commission Européenne.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">9. Mineurs</h2>
                        <p>
                            Fondora n'est pas destinée aux personnes de moins de 18 ans. Aucune donnée concernant des mineurs n'est collectée sciemment.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">10. Modifications</h2>
                        <p>
                            Toute modification substantielle de la présente politique fera l'objet d'une notification lors de votre prochaine connexion. La version en vigueur est toujours consultable depuis l'application. La version précédente reste archivée à des fins de traçabilité.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">11. Contact & réclamations</h2>
                        <p className="mt-2 font-medium text-white">
                            Mathéo Hélou<br />
                            fondora.dev@gmail.com
                        </p>
                        <p className="mt-4">Pour toute réclamation non résolue, vous pouvez contacter la CNIL :</p>
                        <p className="mt-2 text-white">
                            Commission Nationale de l'Informatique et des Libertés<br />
                            3 Place de Fontenoy — TSA 80715 — 75334 Paris Cedex 07<br />
                            <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-emerald hover:underline">www.cnil.fr</a>
                        </p>
                    </section>
                </div>
            </div>
        </div>
    )
}
