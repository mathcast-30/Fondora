-- Étape 11.2 : Migration pour l'Analyseur de Frais "Tous Comptes"

-- 1. Enrichir la table des enveloppes (comptes) - si non existante
ALTER TABLE public.comptes 
ADD COLUMN IF NOT EXISTS frais_gestion_enveloppe NUMERIC(4,2) DEFAULT 0.60;

ALTER TABLE public.comptes 
ADD COLUMN IF NOT EXISTS frais_courtage_pourcentage NUMERIC(4,2) DEFAULT 0.20;

-- 2. Enrichir les assurances vie (si la table existe)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'assurances_vie') THEN
        ALTER TABLE public.assurances_vie ADD COLUMN IF NOT EXISTS frais_gestion_enveloppe NUMERIC(4,2) DEFAULT 0.60;
    END IF;
END $$;

-- 3. Enrichir la table catalogue_actifs (si elle existe)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'catalogue_actifs') THEN
        ALTER TABLE public.catalogue_actifs ADD COLUMN IF NOT EXISTS frais_ter_produit NUMERIC(4,2) DEFAULT 0.00;
    END IF;
END $$;

-- 4. Enrichir la table positions_financieres (fallback)
ALTER TABLE public.positions_financieres ADD COLUMN IF NOT EXISTS frais_ter_produit NUMERIC(4,2) DEFAULT 0.00;

-- 5. Sécurisation
ALTER TABLE public.comptes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions_financieres ENABLE ROW LEVEL SECURITY;
