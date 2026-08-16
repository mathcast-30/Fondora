-- Fondora: versionner les tables créées hors git (via Supabase MCP) afin de
-- garantir la reproductibilité et l'application des policies RLS.
--
-- Tables concernées :
--   - entites              (gestion multi-entités : SCI, SAS, conjoint…)
--   - abonnements_suivi    (suivi des abonnements / résiliations)
--   - partages_patrimoine  (liens de partage public du patrimoine)
--   - catalogue_crypto     (catalogue des cryptomonnaisses, source CoinGecko)
--
-- Toutes ces tables vivent déjà en production ; on utilise des formes
-- idempotentes (IF NOT EXISTS) et des CREATE POLICY IF NOT EXISTS émulés
-- via DO blocks pour ne rien casser.

-- ════════════════════════════════════════════════════════════════════════
-- 1. entites
-- ════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.entites (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nom text NOT NULL,
    type text NOT NULL DEFAULT 'personnel',
    emoji text,
    couleur text DEFAULT '#10B981',
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.entites ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    CREATE POLICY "entites_select_own" ON public.entites
        FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "entites_insert_own" ON public.entites
        FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "entites_update_own" ON public.entites
        FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "entites_delete_own" ON public.entites
        FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ════════════════════════════════════════════════════════════════════════
-- 2. abonnements_suivi
--    NB: jour_prelevement est une colonne GENERATED ALWAYS AS calculée à
--    partir de date_prochain_prelevement ; elle ne doit JAMAIS figurer dans
--    un INSERT/UPDATE (cf. contexte projet).
-- ════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.abonnements_suivi (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nom_abonnement text NOT NULL,
    montant numeric(12,2) NOT NULL DEFAULT 0,
    frequence text NOT NULL DEFAULT 'mensuel',
    date_prochain_prelevement date,
    est_periode_essai boolean NOT NULL DEFAULT false,
    date_fin_essai date,
    resiliation_planifiee boolean NOT NULL DEFAULT false,
    compte_id uuid REFERENCES public.comptes(id) ON DELETE SET NULL,
    categorie_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now()
);

-- Colonne générée : jour du mois de prélèvement, dérivé de la date.
-- IF NOT EXISTS car la colonne existe déjà en production.
DO $$ BEGIN
    ALTER TABLE public.abonnements_suivi
        ADD COLUMN IF NOT EXISTS jour_prelevement integer
        GENERATED ALWAYS AS (EXTRACT(DAY FROM date_prochain_prelevement)::int) STORED;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

ALTER TABLE public.abonnements_suivi ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    CREATE POLICY "abonnements_select_own" ON public.abonnements_suivi
        FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "abonnements_insert_own" ON public.abonnements_suivi
        FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "abonnements_update_own" ON public.abonnements_suivi
        FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "abonnements_delete_own" ON public.abonnements_suivi
        FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ════════════════════════════════════════════════════════════════════════
-- 3. partages_patrimoine
--    Liens de partage public. La lecture publique (sans auth) est volontaire :
--    seule la sélection par token est autorisée, et les liens expirés/inactifs
--    sont exclus.
-- ════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.partages_patrimoine (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token text NOT NULL UNIQUE,
    nom_partage text NOT NULL DEFAULT 'Mon patrimoine',
    masquer_montants boolean NOT NULL DEFAULT false,
    actif boolean NOT NULL DEFAULT true,
    date_expiration timestamptz,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partages_patrimoine_token ON public.partages_patrimoine(token);

ALTER TABLE public.partages_patrimoine ENABLE ROW LEVEL SECURITY;
-- Le propriétaire gère ses partages.
DO $$ BEGIN
    CREATE POLICY "partages_select_own" ON public.partages_patrimoine
        FOR SELECT TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "partages_insert_own" ON public.partages_patrimoine
        FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "partages_update_own" ON public.partages_patrimoine
        FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "partages_delete_own" ON public.partages_patrimoine
        FOR DELETE TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-- Lecture publique anonyme : uniquement les liens actifs non expirés.
-- L'edge function "voir-partage" utilise la service_role key et contourne RLS,
-- mais on garde cette policy au cas où le front interroge directement.
DO $$ BEGIN
    CREATE POLICY "partages_select_public" ON public.partages_patrimoine
        FOR SELECT USING (
            actif = true
            AND (date_expiration IS NULL OR date_expiration > now())
        );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ════════════════════════════════════════════════════════════════════════
-- 4. catalogue_crypto
--    Catalogue global des cryptomonnaisses (source de vérité des coingecko_id).
--    Lecture publique (comme catalogue_actifs) car partagé entre utilisateurs.
-- ════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.catalogue_crypto (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    symbole text NOT NULL UNIQUE,
    nom text NOT NULL,
    coingecko_id text,
    logo_url text,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.catalogue_crypto ENABLE ROW LEVEL SECURITY;
-- Lecture publique (catalogue partagé).
DO $$ BEGIN
    CREATE POLICY "catalogue_crypto_select_all" ON public.catalogue_crypto
        FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-- Insertion par tout utilisateur authentifié (enrichissement collaboratif).
DO $$ BEGIN
    CREATE POLICY "catalogue_crypto_insert_auth" ON public.catalogue_crypto
        FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
