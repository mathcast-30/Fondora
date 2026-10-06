# Politique de Confidentialité

*Version 1.0 — En vigueur depuis le 13 juillet 2026*

---

## 1. Responsable du traitement

**Mathéo Hélou**  
Particulier — Éditeur de Fondora  
Contact : fondora.dev@gmail.com

---

## 2. Données collectées

### 2.1 Données d'inscription
- Adresse email
- Mot de passe (stocké sous forme chiffrée par Supabase Auth — jamais accessible en clair)

### 2.2 Données de profil (saisies volontairement)
- Prénom / nom d'affichage
- Situation familiale (célibataire, marié/pacsé)
- Objectif patrimonial principal
- Devise de référence
- Préférences de modules actifs

### 2.3 Données financières personnelles (saisies volontairement)
- Comptes bancaires et soldes
- Transactions et catégories de dépenses
- Budgets mensuels
- Positions d'investissement (actions, ETF, crypto, assurance-vie)
- Biens immobiliers et dettes associées
- Actifs tangibles et leur valorisation estimée

### 2.4 Données techniques
- Logs de connexion (horodatage, adresse IP) gérés par Supabase Auth
- Consentements RGPD (type, version, date d'acceptation)
- Notifications in-app (générées automatiquement par l'application)

### 2.5 Données NON collectées
Fondora ne collecte **pas** :
- De cookies de tracking ou publicitaires
- De données de navigation entre pages
- D'informations issues de tiers (banques, courtiers, etc.)
- De données de localisation

---

## 3. Finalités et bases légales du traitement

| Finalité | Base légale | Durée de conservation |
|---|---|---|
| Fourniture du service (authentification, affichage des données) | Exécution du contrat (Art. 6.1.b RGPD) | Durée du compte + 30 jours après suppression |
| Calculs financiers et projections | Exécution du contrat (Art. 6.1.b RGPD) | Durée du compte |
| Traçabilité des consentements | Obligation légale (Art. 6.1.c RGPD) | 5 ans après le consentement |
| Notifications in-app | Intérêt légitime (Art. 6.1.f RGPD) | 90 jours glissants |
| Amélioration du service (logs techniques) | Intérêt légitime (Art. 6.1.f RGPD) | 30 jours |

---

## 4. Sous-traitants

Fondora utilise les sous-traitants suivants, tous conformes au RGPD :

| Sous-traitant | Rôle | Localisation des données | Garanties |
|---|---|---|---|
| **Supabase** | Base de données, authentification | eu-west-3 (Paris, France) | DPA disponible sur supabase.com/privacy |
| **Vercel** | Hébergement de l'application front-end | Réseau CDN mondial (edge) | DPA disponible sur vercel.com/legal/privacy-policy |

Aucune donnée n'est vendue, partagée ou transmise à des tiers à des fins commerciales ou publicitaires.

---

## 5. Cookies

### Cookies essentiels (exemptés de consentement)
Fondora utilise uniquement des cookies techniques indispensables au fonctionnement du service :

| Cookie | Finalité | Durée |
|---|---|---|
| `sb-access-token` | Session d'authentification Supabase | Session / 1 heure |
| `sb-refresh-token` | Renouvellement automatique de session | 7 jours |

Ces cookies sont nécessaires à la connexion et ne peuvent pas être désactivés sans empêcher l'accès au service.

### Cookies tiers
Fondora ne dépose **aucun cookie publicitaire, analytique ou de tracking tiers** à ce jour.

Si des outils d'analyse devaient être ajoutés à l'avenir, la présente politique serait mise à jour et un nouveau consentement vous serait demandé.

---

## 6. Vos droits (RGPD)

Conformément aux articles 15 à 22 du Règlement Général sur la Protection des Données, vous disposez des droits suivants :

| Droit | Comment l'exercer |
|---|---|
| **Droit d'accès** (Art. 15) | Page Paramètres → Export de mes données |
| **Droit de rectification** (Art. 16) | Page Paramètres → Profil |
| **Droit à l'effacement** (Art. 17) | Page Paramètres → Compte → Supprimer mon compte |
| **Droit à la portabilité** (Art. 20) | Page Paramètres → Export de mes données (format JSON/CSV) |
| **Droit d'opposition** (Art. 21) | Contact : fondora.dev@gmail.com |
| **Droit à la limitation** (Art. 18) | Contact : fondora.dev@gmail.com |

Toute demande sera traitée dans un délai maximum de **30 jours**.

Vous disposez également du droit d'introduire une réclamation auprès de la **CNIL** (Commission Nationale de l'Informatique et des Libertés) : [www.cnil.fr](https://www.cnil.fr)

---

## 7. Sécurité

Les mesures de sécurité mises en œuvre incluent :

- Chiffrement de toutes les communications (HTTPS/TLS)
- Authentification sécurisée via Supabase Auth (bcrypt)
- Isolation des données par utilisateur via Row Level Security (RLS) PostgreSQL
- Aucun accès des équipes de Fondora aux données financières des utilisateurs
- Suppression en cascade de toutes les données lors de la clôture du compte

---

## 8. Transferts hors UE

Les données sont hébergées en France (Supabase, région eu-west-3). L'application front-end est distribuée via le réseau CDN de Vercel, dont certains nœuds sont situés hors de l'Union Européenne. Ces transferts sont encadrés par les Clauses Contractuelles Types (CCT) de la Commission Européenne.

---

## 9. Mineurs

Fondora n'est pas destinée aux personnes de moins de 18 ans. Aucune donnée concernant des mineurs n'est collectée sciemment.

---

## 10. Modifications

Toute modification substantielle de la présente politique fera l'objet d'une notification lors de votre prochaine connexion. La version en vigueur est toujours consultable depuis l'application. La version précédente reste archivée à des fins de traçabilité.

---

## 11. Contact & réclamations

**Mathéo Hélou**  
fondora.dev@gmail.com  

Pour toute réclamation non résolue, vous pouvez contacter la CNIL :  
Commission Nationale de l'Informatique et des Libertés  
3 Place de Fontenoy — TSA 80715 — 75334 Paris Cedex 07  
[www.cnil.fr](https://www.cnil.fr)
