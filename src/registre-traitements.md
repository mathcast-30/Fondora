# Registre des Activités de Traitement — FONDORA

*Document interne — Non publié — Version 1.0 — 13 juillet 2026*  
*Responsable du traitement : Mathéo Hélou — fondora.dev@gmail.com*

---

## Traitement n°1 — Gestion des comptes utilisateurs

| Champ | Détail |
|---|---|
| **Finalité** | Création et gestion des comptes, authentification |
| **Base légale** | Exécution du contrat (Art. 6.1.b RGPD) |
| **Catégories de données** | Email, mot de passe chiffré, date d'inscription, dernière connexion |
| **Catégories de personnes** | Utilisateurs inscrits |
| **Destinataires** | Supabase (sous-traitant) |
| **Durée de conservation** | Durée du compte + 30 jours après suppression |
| **Transferts hors UE** | Non (Supabase eu-west-3, Paris) |
| **Mesures de sécurité** | HTTPS, bcrypt, RLS PostgreSQL |

---

## Traitement n°2 — Gestion des données financières personnelles

| Champ | Détail |
|---|---|
| **Finalité** | Affichage, calcul et analyse du patrimoine de l'utilisateur |
| **Base légale** | Exécution du contrat (Art. 6.1.b RGPD) |
| **Catégories de données** | Comptes, transactions, budgets, investissements, immobilier, dettes, actifs tangibles |
| **Catégories de personnes** | Utilisateurs inscrits |
| **Destinataires** | Supabase (sous-traitant) |
| **Durée de conservation** | Durée du compte — suppression immédiate à la clôture |
| **Transferts hors UE** | Non |
| **Mesures de sécurité** | RLS PostgreSQL (isolation stricte par user_id = auth.uid()) |

---

## Traitement n°3 — Traçabilité des consentements RGPD

| Champ | Détail |
|---|---|
| **Finalité** | Preuve juridique du consentement aux CGU, politique de confidentialité et cookies |
| **Base légale** | Obligation légale (Art. 6.1.c RGPD) |
| **Catégories de données** | user_id, type de consentement, version, date, IP (optionnel), user-agent (optionnel) |
| **Catégories de personnes** | Utilisateurs inscrits |
| **Destinataires** | Supabase (sous-traitant) |
| **Durée de conservation** | 5 ans après la date de consentement |
| **Transferts hors UE** | Non |
| **Mesures de sécurité** | RLS — lecture seule par l'utilisateur, insertion uniquement |

---

## Traitement n°4 — Notifications in-app

| Champ | Détail |
|---|---|
| **Finalité** | Alertes personnalisées (dépassement budget, approche seuil fiscal, fin de crédit…) |
| **Base légale** | Intérêt légitime (Art. 6.1.f RGPD) — amélioration de l'expérience utilisateur |
| **Catégories de données** | user_id, type d'alerte, message, statut lu/non-lu, date |
| **Catégories de personnes** | Utilisateurs inscrits |
| **Destinataires** | Supabase (sous-traitant) |
| **Durée de conservation** | 90 jours glissants |
| **Transferts hors UE** | Non |
| **Mesures de sécurité** | RLS — INSERT réservé au service_role (Edge Functions) |

---

## Traitement n°5 — Logs techniques et sécurité

| Champ | Détail |
|---|---|
| **Finalité** | Sécurité, détection de fraude, débogage |
| **Base légale** | Intérêt légitime (Art. 6.1.f RGPD) |
| **Catégories de données** | Adresse IP, horodatage, user-agent (gérés par Supabase Auth) |
| **Catégories de personnes** | Tous les visiteurs |
| **Destinataires** | Supabase (sous-traitant) |
| **Durée de conservation** | 30 jours |
| **Transferts hors UE** | Non |
| **Mesures de sécurité** | Accès restreint — non accessible aux utilisateurs |

---

## Sous-traitants référencés

| Sous-traitant | Pays | DPA signé | Lien |
|---|---|---|---|
| Supabase Inc. | USA (données EU) | Oui (standard contractuel) | https://supabase.com/privacy |
| Vercel Inc. | USA (CDN mondial) | Oui (CCT Commission EU) | https://vercel.com/legal/privacy-policy |

---

## Historique des versions

| Version | Date | Modifications |
|---|---|---|
| 1.0 | 13/07/2026 | Création initiale |
