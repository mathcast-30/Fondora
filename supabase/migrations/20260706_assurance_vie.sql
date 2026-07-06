-- ============================================================
-- Migration : Module Assurance Vie — Fondora
-- Étape 11.1
-- Date     : 2026-07-06
-- Corrections : UNIQUE(contrat_id, date), FK → catalogue_actifs,
--              RLS étanche, ALTER snapshot_patrimoine
-- ============================================================

-- ============================================================
-- TABLE 1 : assurances_vie
-- Contrat principal (une ligne par contrat AV de l'utilisateur)
-- ============================================================
CREATE TABLE IF NOT EXISTS assurances_vie (
    id                       UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                  UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nom                      TEXT         NOT NULL,
    assureur                 TEXT         NOT NULL,
    date_ouverture           DATE         NOT NULL,
    -- Frais annuels de l'assureur sur l'enveloppe (ex: 0.60 = 0,60 %)
    frais_gestion_enveloppe  NUMERIC(4,2) NOT NULL DEFAULT 0.60,
    created_at               TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assurances_vie_user_id
    ON assurances_vie (user_id);

ALTER TABLE assurances_vie ENABLE ROW LEVEL SECURITY;

CREATE POLICY "av_select_own"  ON assurances_vie FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "av_insert_own"  ON assurances_vie FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "av_update_own"  ON assurances_vie FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "av_delete_own"  ON assurances_vie FOR DELETE USING (auth.uid() = user_id);


-- ============================================================
-- TABLE 2 : assurances_vie_versements
-- Historique de tous les versements effectués sur un contrat.
-- Chaque versement est un flux de trésorerie négatif pour XIRR.
-- ============================================================
CREATE TABLE IF NOT EXISTS assurances_vie_versements (
    id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    contrat_id  UUID          NOT NULL REFERENCES assurances_vie(id) ON DELETE CASCADE,
    user_id     UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date        DATE          NOT NULL,
    montant     NUMERIC(12,2) NOT NULL CHECK (montant > 0),
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_av_versements_contrat_id ON assurances_vie_versements (contrat_id);
CREATE INDEX IF NOT EXISTS idx_av_versements_user_id    ON assurances_vie_versements (user_id);
CREATE INDEX IF NOT EXISTS idx_av_versements_date       ON assurances_vie_versements (date);

ALTER TABLE assurances_vie_versements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "av_versements_select_own" ON assurances_vie_versements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "av_versements_insert_own" ON assurances_vie_versements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "av_versements_update_own" ON assurances_vie_versements FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "av_versements_delete_own" ON assurances_vie_versements FOR DELETE USING (auth.uid() = user_id);


-- ============================================================
-- TABLE 3 : assurances_vie_valorisations
-- Historique de la valeur du Fonds Euros.
-- CORRECTION : UNIQUE(contrat_id, date) empêche les doublons journaliers.
-- Pour mettre à jour une valorisation du jour : utiliser upsert
-- avec la contrainte ON CONFLICT (contrat_id, date) DO UPDATE.
-- ============================================================
CREATE TABLE IF NOT EXISTS assurances_vie_valorisations (
    id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    contrat_id  UUID          NOT NULL REFERENCES assurances_vie(id) ON DELETE CASCADE,
    user_id     UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date        DATE          NOT NULL,
    valeur      NUMERIC(12,2) NOT NULL CHECK (valeur >= 0),
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),

    -- Garantit qu'il n'y a qu'une seule valorisation Fonds Euros par jour par contrat
    CONSTRAINT uq_av_valorisation_contrat_date UNIQUE (contrat_id, date)
);

CREATE INDEX IF NOT EXISTS idx_av_valorisations_contrat_date
    ON assurances_vie_valorisations (contrat_id, date DESC);

ALTER TABLE assurances_vie_valorisations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "av_valorisations_select_own" ON assurances_vie_valorisations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "av_valorisations_insert_own" ON assurances_vie_valorisations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "av_valorisations_update_own" ON assurances_vie_valorisations FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "av_valorisations_delete_own" ON assurances_vie_valorisations FOR DELETE USING (auth.uid() = user_id);


-- ============================================================
-- TABLE 4 : assurances_vie_positions
-- Positions en Unités de Compte (UC) sur un contrat AV.
-- CORRECTION : asset_id FK → catalogue_actifs(id)
--              isin dénormalisé pour les jointures avec asset_prices_cache.
-- Le prix de marché est lu EXCLUSIVEMENT depuis asset_prices_cache.
-- ============================================================
CREATE TABLE IF NOT EXISTS assurances_vie_positions (
    id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    contrat_id  UUID          NOT NULL REFERENCES assurances_vie(id) ON DELETE CASCADE,
    user_id     UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Lien vers le catalogue d'actifs de référence
    asset_id    UUID          NOT NULL REFERENCES catalogue_actifs(id) ON DELETE RESTRICT,
    -- Dénormalisé pour faciliter les jointures avec asset_prices_cache
    isin        TEXT          NOT NULL,

    nb_parts    NUMERIC(12,4) NOT NULL DEFAULT 0 CHECK (nb_parts >= 0),
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),

    -- Un seul enregistrement par UC et par contrat (position agrégée)
    CONSTRAINT uq_av_position_contrat_asset UNIQUE (contrat_id, asset_id)
);

CREATE INDEX IF NOT EXISTS idx_av_positions_contrat_id ON assurances_vie_positions (contrat_id);
CREATE INDEX IF NOT EXISTS idx_av_positions_user_id    ON assurances_vie_positions (user_id);
CREATE INDEX IF NOT EXISTS idx_av_positions_isin       ON assurances_vie_positions (isin);

ALTER TABLE assurances_vie_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "av_positions_select_own" ON assurances_vie_positions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "av_positions_insert_own" ON assurances_vie_positions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "av_positions_update_own" ON assurances_vie_positions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "av_positions_delete_own" ON assurances_vie_positions FOR DELETE USING (auth.uid() = user_id);


-- ============================================================
-- TABLE 5 : asset_prices_cache
-- Cache des derniers prix de marché, alimenté par le cron Finnhub
-- via Edge Function avec service role (jamais depuis le front-end).
-- Responsabilité unique : fournir dernier_prix pour valoriser les UC.
-- ============================================================
CREATE TABLE IF NOT EXISTS asset_prices_cache (
    id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id     UUID          NOT NULL REFERENCES catalogue_actifs(id) ON DELETE CASCADE,
    isin         TEXT          NOT NULL,
    dernier_prix NUMERIC(12,4),          -- NULL si jamais récupéré
    devise       TEXT          NOT NULL DEFAULT 'EUR',
    updated_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),

    CONSTRAINT uq_asset_price_cache_asset UNIQUE (asset_id)
);

CREATE INDEX IF NOT EXISTS idx_asset_prices_cache_isin    ON asset_prices_cache (isin);
CREATE INDEX IF NOT EXISTS idx_asset_prices_cache_updated ON asset_prices_cache (updated_at DESC);

-- Lecture publique (les prix de marché ne sont pas des données personnelles).
-- Écriture réservée à la Edge Function / service role.
ALTER TABLE asset_prices_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prices_cache_select_all" ON asset_prices_cache
    FOR SELECT USING (true);


-- ============================================================
-- ENRICHISSEMENT : snapshot_patrimoine
-- Ajout de la colonne total_assurance_vie.
-- Le cron de snapshot (Edge Function) alimente cette colonne
-- en faisant la somme des valeurs actuelles de tous les contrats.
-- ============================================================
ALTER TABLE snapshot_patrimoine
    ADD COLUMN IF NOT EXISTS total_assurance_vie NUMERIC(12,2) NOT NULL DEFAULT 0;


-- ============================================================
-- VUE UTILITAIRE : av_valorisation_actuelle
-- Renvoie la DERNIÈRE valorisation Fonds Euros par contrat.
-- Utilisée par le hook useAssurancesVie pour calculer la valeur actuelle.
-- ============================================================
CREATE OR REPLACE VIEW av_valorisation_actuelle AS
SELECT DISTINCT ON (contrat_id)
    contrat_id,
    user_id,
    date  AS derniere_date_valorisation,
    valeur AS valeur_fonds_euros
FROM assurances_vie_valorisations
ORDER BY contrat_id, date DESC;


-- ============================================================
-- COMMENTAIRES DOCUMENTATION
-- ============================================================
COMMENT ON TABLE assurances_vie
    IS 'Contrats d''Assurance Vie. frais_gestion_enveloppe = % annuel prélevé par l''assureur.';

COMMENT ON TABLE assurances_vie_versements
    IS 'Flux de versements (entrées de capital) sur un contrat AV. Base du calcul XIRR (flux négatifs).';

COMMENT ON TABLE assurances_vie_valorisations
    IS 'Historique de la valeur du Fonds Euros. UNIQUE(contrat_id, date) : upsert recommandé côté client.';

COMMENT ON COLUMN assurances_vie_valorisations.valeur
    IS 'Valeur totale du compartiment Fonds Euros à cette date (saisie manuelle par l''utilisateur).';

COMMENT ON TABLE assurances_vie_positions
    IS 'Positions UC (Unités de Compte) sur un contrat AV. Prix de marché lu dans asset_prices_cache.';

COMMENT ON COLUMN assurances_vie_positions.asset_id
    IS 'FK vers catalogue_actifs(id). Permet de récupérer nom, ISIN et frais_ter_produit pour les calculs de frais cumulés.';

COMMENT ON COLUMN assurances_vie_positions.isin
    IS 'Dénormalisé depuis catalogue_actifs. Utilisé pour joindre asset_prices_cache sans passer par catalogue_actifs.';

COMMENT ON TABLE asset_prices_cache
    IS 'Cache des derniers prix de marché (cron Finnhub). Lecture seule côté client. NE JAMAIS appeler Finnhub depuis le front-end.';

COMMENT ON COLUMN asset_prices_cache.dernier_prix
    IS 'Dernier prix connu en devise locale. NULL = jamais synchronisé. L''UI doit afficher "Prix indisponible" dans ce cas.';

COMMENT ON COLUMN snapshot_patrimoine.total_assurance_vie
    IS 'Somme des valeurs actuelles de tous les contrats AV de l''utilisateur à la date du snapshot.';
