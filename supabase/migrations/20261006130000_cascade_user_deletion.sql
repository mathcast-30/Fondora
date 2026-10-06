-- Migration : Passage en ON DELETE CASCADE sur l'ensemble des tables liées à auth.users(id)
-- Cette migration garantit la suppression complète et automatique des données utilisateur
-- lors de l'appel à supabase.auth.admin.deleteUser(userId) conformément au RGPD Art. 17.

-- 1. Biens immobiliers
ALTER TABLE IF EXISTS public.biens_immobiliers
    DROP CONSTRAINT IF EXISTS biens_immobiliers_user_id_fkey,
    ADD CONSTRAINT biens_immobiliers_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Budgets
ALTER TABLE IF EXISTS public.budgets
    DROP CONSTRAINT IF EXISTS budgets_user_id_fkey,
    ADD CONSTRAINT budgets_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Catégories
ALTER TABLE IF EXISTS public.categories
    DROP CONSTRAINT IF EXISTS categories_user_id_fkey,
    ADD CONSTRAINT categories_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Comptes
ALTER TABLE IF EXISTS public.comptes
    DROP CONSTRAINT IF EXISTS comptes_user_id_fkey,
    ADD CONSTRAINT comptes_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 5. Dividendes
ALTER TABLE IF EXISTS public.dividendes
    DROP CONSTRAINT IF EXISTS dividendes_user_id_fkey,
    ADD CONSTRAINT dividendes_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 6. Historique patrimoine
ALTER TABLE IF EXISTS public.historique_patrimoine
    DROP CONSTRAINT IF EXISTS historique_patrimoine_user_id_fkey,
    ADD CONSTRAINT historique_patrimoine_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 7. Objectifs d'épargne
ALTER TABLE IF EXISTS public.objectifs_epargne
    DROP CONSTRAINT IF EXISTS objectifs_epargne_user_id_fkey,
    ADD CONSTRAINT objectifs_epargne_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 8. Positions crypto
ALTER TABLE IF EXISTS public.positions_crypto
    DROP CONSTRAINT IF EXISTS positions_crypto_user_id_fkey,
    ADD CONSTRAINT positions_crypto_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 9. Positions financières
ALTER TABLE IF EXISTS public.positions_financieres
    DROP CONSTRAINT IF EXISTS positions_financieres_user_id_fkey,
    ADD CONSTRAINT positions_financieres_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 10. Transactions
ALTER TABLE IF EXISTS public.transactions
    DROP CONSTRAINT IF EXISTS transactions_user_id_fkey,
    ADD CONSTRAINT transactions_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 11. Actifs tangibles (si la table existe)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'actifs_tangibles'
    ) THEN
        ALTER TABLE public.actifs_tangibles
            DROP CONSTRAINT IF EXISTS actifs_tangibles_user_id_fkey,
            ADD CONSTRAINT actifs_tangibles_user_id_fkey
                FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 12. Alertes utilisateur (si la table existe)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'alertes_utilisateur'
    ) THEN
        ALTER TABLE public.alertes_utilisateur
            DROP CONSTRAINT IF EXISTS alertes_utilisateur_user_id_fkey,
            ADD CONSTRAINT alertes_utilisateur_user_id_fkey
                FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 13. Smart rules (si la table existe)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'smart_rules'
    ) THEN
        ALTER TABLE public.smart_rules
            DROP CONSTRAINT IF EXISTS smart_rules_user_id_fkey,
            ADD CONSTRAINT smart_rules_user_id_fkey
                FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 14. Demandes suppression (si la table existe)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'demandes_suppression'
    ) THEN
        ALTER TABLE public.demandes_suppression
            DROP CONSTRAINT IF EXISTS demandes_suppression_user_id_fkey,
            ADD CONSTRAINT demandes_suppression_user_id_fkey
                FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 15. Consentements (si la table existe)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'consentements'
    ) THEN
        ALTER TABLE public.consentements
            DROP CONSTRAINT IF EXISTS consentements_user_id_fkey,
            ADD CONSTRAINT consentements_user_id_fkey
                FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 16. Notifications log (si la table existe)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'notifications_log'
    ) THEN
        ALTER TABLE public.notifications_log
            DROP CONSTRAINT IF EXISTS notifications_log_user_id_fkey,
            ADD CONSTRAINT notifications_log_user_id_fkey
                FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;
