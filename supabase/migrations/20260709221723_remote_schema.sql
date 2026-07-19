


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."creer_categories_par_defaut"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO categories (user_id, nom, type, couleur) VALUES
    (NEW.id, 'Alimentation et Boissons', 'depense', '#f59e0b'),
    (NEW.id, 'Logement', 'depense', '#3b82f6'),
    (NEW.id, 'Auto et Transports', 'depense', '#8b5cf6'),
    (NEW.id, 'Loisirs et Divertissements', 'depense', '#ec4899'),
    (NEW.id, 'Santé', 'depense', '#ef4444'),
    (NEW.id, 'Abonnements', 'depense', '#6366f1'),
    (NEW.id, 'Affaires et Travail', 'depense', '#78716c'),
    (NEW.id, 'Éducation', 'depense', '#0ea5e9'),
    (NEW.id, 'Salaire', 'revenu', '#10b981'),
    (NEW.id, 'Dividendes', 'revenu', '#22c55e'),
    (NEW.id, 'Autre revenu', 'revenu', '#84cc16');
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."creer_categories_par_defaut"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- On force l'insertion dans le schéma "public" et la table en minuscules "profiles"
  INSERT INTO public.profiles (id)
  VALUES (new.id)
  ON CONFLICT (id) DO NOTHING; -- Évite de planter si le profil existe déjà
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."injecter_mensualites_budget"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    dette_row dettes%ROWTYPE;
BEGIN
    FOR dette_row IN
        SELECT *
        FROM dettes
        WHERE rembourse_automatiquement = TRUE
          AND (date_debut + (duree_mois || ' months')::INTERVAL) > CURRENT_DATE
    LOOP
        INSERT INTO transactions (
            user_id,
            montant,
            description,
            categorie,
            date,
            source
        )
        VALUES (
            dette_row.user_id,
            -dette_row.mensualite,
            'Remboursement : ' || dette_row.nom,
            dette_row.type,
            CURRENT_DATE,
            'auto_dette'
        )
        ON CONFLICT DO NOTHING;
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."injecter_mensualites_budget"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."asset_prices_cache" (
    "symbole" "text" NOT NULL,
    "prix_actuel" numeric(15,4),
    "variation_24h" numeric(8,4),
    "devise" "text" DEFAULT 'EUR'::"text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "isin" "text",
    "dernier_prix" numeric(12,4)
);


ALTER TABLE "public"."asset_prices_cache" OWNER TO "postgres";


COMMENT ON TABLE "public"."asset_prices_cache" IS 'Cache des derniers prix de marché (cron Finnhub). Lecture seule côté client. NE JAMAIS appeler Finnhub depuis le front-end.';



COMMENT ON COLUMN "public"."asset_prices_cache"."dernier_prix" IS 'Dernier prix connu en devise locale. NULL = jamais synchronisé. L''UI doit afficher "Prix indisponible" dans ce cas.';



CREATE TABLE IF NOT EXISTS "public"."assurances_vie" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "nom" "text" NOT NULL,
    "assureur" "text" NOT NULL,
    "date_ouverture" "date" NOT NULL,
    "frais_gestion_enveloppe" numeric(4,2) DEFAULT 0.60 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."assurances_vie" OWNER TO "postgres";


COMMENT ON TABLE "public"."assurances_vie" IS 'Contrats d''Assurance Vie. frais_gestion_enveloppe = % annuel prélevé par l''assureur.';



CREATE TABLE IF NOT EXISTS "public"."assurances_vie_positions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contrat_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "asset_id" "uuid" NOT NULL,
    "isin" "text" NOT NULL,
    "nb_parts" numeric(12,4) DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "assurances_vie_positions_nb_parts_check" CHECK (("nb_parts" >= (0)::numeric))
);


ALTER TABLE "public"."assurances_vie_positions" OWNER TO "postgres";


COMMENT ON TABLE "public"."assurances_vie_positions" IS 'Positions UC (Unités de Compte) sur un contrat AV. Prix de marché lu dans asset_prices_cache.';



COMMENT ON COLUMN "public"."assurances_vie_positions"."asset_id" IS 'FK vers catalogue_actifs(id). Permet de récupérer nom, ISIN et frais_ter_produit pour les calculs de frais cumulés.';



COMMENT ON COLUMN "public"."assurances_vie_positions"."isin" IS 'Dénormalisé depuis catalogue_actifs. Utilisé pour joindre asset_prices_cache sans passer par catalogue_actifs.';



CREATE TABLE IF NOT EXISTS "public"."assurances_vie_valorisations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contrat_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "valeur" numeric(12,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "assurances_vie_valorisations_valeur_check" CHECK (("valeur" >= (0)::numeric))
);


ALTER TABLE "public"."assurances_vie_valorisations" OWNER TO "postgres";


COMMENT ON TABLE "public"."assurances_vie_valorisations" IS 'Historique de la valeur du Fonds Euros. UNIQUE(contrat_id, date) : upsert recommandé côté client.';



COMMENT ON COLUMN "public"."assurances_vie_valorisations"."valeur" IS 'Valeur totale du compartiment Fonds Euros à cette date (saisie manuelle par l''utilisateur).';



CREATE TABLE IF NOT EXISTS "public"."assurances_vie_versements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contrat_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "montant" numeric(12,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "assurances_vie_versements_montant_check" CHECK (("montant" > (0)::numeric))
);


ALTER TABLE "public"."assurances_vie_versements" OWNER TO "postgres";


COMMENT ON TABLE "public"."assurances_vie_versements" IS 'Flux de versements (entrées de capital) sur un contrat AV. Base du calcul XIRR (flux négatifs).';



CREATE OR REPLACE VIEW "public"."av_valorisation_actuelle" WITH ("security_invoker"='on') AS
 SELECT DISTINCT ON ("contrat_id") "contrat_id",
    "user_id",
    "date" AS "derniere_date_valorisation",
    "valeur" AS "valeur_fonds_euros"
   FROM "public"."assurances_vie_valorisations"
  ORDER BY "contrat_id", "date" DESC;


ALTER VIEW "public"."av_valorisation_actuelle" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."biens_immobiliers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "nom" "text" NOT NULL,
    "adresse" "text",
    "type_bien" "text" DEFAULT 'Appartement'::"text",
    "statut" "text" DEFAULT 'Résidence principale'::"text",
    "prix_achat" numeric DEFAULT 0 NOT NULL,
    "valeur_actuelle" numeric DEFAULT 0 NOT NULL,
    "date_achat" "date",
    "montant_credit" numeric DEFAULT 0,
    "taux_credit" numeric DEFAULT 0,
    "duree_credit_mois" integer DEFAULT 0,
    "mensualite_credit" numeric DEFAULT 0,
    "assurance_emprunteur_annuelle" numeric DEFAULT 0,
    "taxe_fonciere_annuelle" numeric DEFAULT 0,
    "charges_copropriete_annuelle" numeric DEFAULT 0,
    "assurance_habitation_annuelle" numeric DEFAULT 0,
    "frais_gestion_annuelle" numeric DEFAULT 0,
    "travaux_annuels" numeric DEFAULT 0,
    "loyer_mensuel" numeric DEFAULT 0,
    "taux_vacance" numeric DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."biens_immobiliers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."budgets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "categorie_id" "uuid" NOT NULL,
    "montant_max" numeric NOT NULL,
    "mois" integer NOT NULL,
    "annee" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."budgets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cache_des_prix_des_actifs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ticker" "text" NOT NULL,
    "prix" numeric(12,4),
    "derniere_maj" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."cache_des_prix_des_actifs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."catalogue_actifs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ticker" "text" NOT NULL,
    "isin" "text",
    "nom" "text" NOT NULL,
    "type" "text" NOT NULL,
    "devise" "text" DEFAULT 'EUR'::"text" NOT NULL,
    "logo_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "frais_ter_produit" numeric(4,2) DEFAULT 0.00,
    CONSTRAINT "catalogue_actifs_type_check" CHECK (("type" = ANY (ARRAY['ACTION'::"text", 'ETF'::"text"])))
);


ALTER TABLE "public"."catalogue_actifs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "nom" "text" NOT NULL,
    "type" "text" DEFAULT 'depense'::"text" NOT NULL,
    "couleur" "text" DEFAULT '#10b981'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comptes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "nom" "text" NOT NULL,
    "type" "text" NOT NULL,
    "solde" numeric DEFAULT 0,
    "devise" "text" DEFAULT 'EUR'::"text",
    "couleur" "text" DEFAULT '#10b981'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "frais_gestion_enveloppe" numeric(4,2) DEFAULT 0.60,
    "frais_courtage_pourcentage" numeric(4,2) DEFAULT 0.20
);


ALTER TABLE "public"."comptes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dettes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "nom" "text" NOT NULL,
    "type" "text" NOT NULL,
    "bien_immobilier_id" "uuid",
    "capital_emprunte" numeric(12,2) NOT NULL,
    "taux_interet" numeric(5,3) NOT NULL,
    "duree_mois" integer NOT NULL,
    "mensualite" numeric(10,2) NOT NULL,
    "date_debut" "date" NOT NULL,
    "rembourse_automatiquement" boolean DEFAULT true,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "dettes_type_check" CHECK (("type" = ANY (ARRAY['Immobilier'::"text", 'Consommation'::"text", 'Automobile'::"text", 'Dette Privée'::"text", 'Fiscale'::"text", 'Autre'::"text"])))
);


ALTER TABLE "public"."dettes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dividendes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "position_id" "uuid",
    "montant" numeric NOT NULL,
    "date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."dividendes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."historique_patrimoine" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "valeur_positions" numeric DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."historique_patrimoine" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."historique_prix_actifs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "actif_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "prix_cloture" numeric(12,4) NOT NULL
);


ALTER TABLE "public"."historique_prix_actifs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."historique_valeur_crypto" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "date_historique" "date" NOT NULL,
    "valeur_totale" numeric(18,4) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."historique_valeur_crypto" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."objectifs_epargne" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "montant_cible" numeric NOT NULL,
    "mois" integer NOT NULL,
    "annee" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."objectifs_epargne" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."positions_crypto" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "coin_id" "text" NOT NULL,
    "symbole" "text" NOT NULL,
    "nom" "text",
    "quantite" numeric NOT NULL,
    "prix_achat_moyen" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "date_achat" "date"
);


ALTER TABLE "public"."positions_crypto" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."positions_financieres" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "symbole" "text" NOT NULL,
    "nom" "text",
    "quantite" numeric NOT NULL,
    "prix_achat_moyen" numeric NOT NULL,
    "devise" "text" DEFAULT 'EUR'::"text",
    "type_compte" "text" DEFAULT 'PEA'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "date_achat" "date",
    "secteur" "text",
    "plus_value_realisee" numeric(15,2) DEFAULT 0,
    "frais_ter_produit" numeric(4,2) DEFAULT 0.00
);


ALTER TABLE "public"."positions_financieres" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "nom" "text",
    "situation_familiale" "text" DEFAULT 'celibataire'::"text",
    "objectif_principal" "text",
    "modules_actifs" "text"[] DEFAULT '{}'::"text"[],
    "onboarding_completed" boolean DEFAULT false,
    "devise_reference" "text" DEFAULT 'EUR'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "objectif_epargne_mensuel" numeric(12,2) DEFAULT 0
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."snapshot_patrimoine" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "total_cash" numeric(15,2) DEFAULT 0,
    "total_bourse" numeric(15,2) DEFAULT 0,
    "total_crypto" numeric(15,2) DEFAULT 0,
    "total_assurance_vie" numeric(15,2) DEFAULT 0,
    "total_immo_net" numeric(15,2) DEFAULT 0,
    "total_tangible" numeric(15,2) DEFAULT 0,
    "total_dettes" numeric(15,2) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."snapshot_patrimoine" OWNER TO "postgres";


COMMENT ON COLUMN "public"."snapshot_patrimoine"."total_assurance_vie" IS 'Somme des valeurs actuelles de tous les contrats AV de l''utilisateur à la date du snapshot.';



CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "compte_id" "uuid",
    "categorie_id" "uuid",
    "description" "text",
    "montant" numeric NOT NULL,
    "type" "text" DEFAULT 'depense'::"text" NOT NULL,
    "date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "recurrente" boolean DEFAULT false,
    "jour_recurrence" integer,
    "recurrence_groupe_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "montant_devise_originale" numeric,
    "devise_originale" "text"
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transactions_bourse" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "compte_id" "uuid" NOT NULL,
    "actif_id" "uuid" NOT NULL,
    "type_transaction" "text" NOT NULL,
    "date_transaction" "date" DEFAULT CURRENT_DATE NOT NULL,
    "quantite" numeric(12,4) NOT NULL,
    "prix_unitaire" numeric(12,2) NOT NULL,
    "frais" numeric(8,2) DEFAULT 0.00,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "montant_devise_originale" numeric,
    "devise_originale" "text",
    CONSTRAINT "transactions_bourse_type_transaction_check" CHECK (("type_transaction" = ANY (ARRAY['ACHAT'::"text", 'VENTE'::"text"])))
);


ALTER TABLE "public"."transactions_bourse" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transactions_crypto" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "coin_id" "text" NOT NULL,
    "symbole" "text" NOT NULL,
    "nom" "text" NOT NULL,
    "type_transaction" "text" NOT NULL,
    "quantite" numeric(18,8) NOT NULL,
    "prix_unitaire_eur" numeric(18,4) NOT NULL,
    "frais_eur" numeric(18,4) DEFAULT 0,
    "valeur_globale_portefeuille_lors_vente" numeric(18,4) DEFAULT NULL::numeric,
    "date_transaction" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "montant_devise_originale" numeric,
    "devise_originale" "text",
    CONSTRAINT "transactions_crypto_frais_eur_check" CHECK (("frais_eur" >= (0)::numeric)),
    CONSTRAINT "transactions_crypto_prix_unitaire_eur_check" CHECK (("prix_unitaire_eur" >= (0)::numeric)),
    CONSTRAINT "transactions_crypto_quantite_check" CHECK (("quantite" > (0)::numeric)),
    CONSTRAINT "transactions_crypto_type_transaction_check" CHECK (("type_transaction" = ANY (ARRAY['achat'::"text", 'vente'::"text"])))
);


ALTER TABLE "public"."transactions_crypto" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transactions_investissement" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "position_id" "uuid",
    "type" "text" NOT NULL,
    "symbole" "text" NOT NULL,
    "quantite" numeric(15,6) NOT NULL,
    "prix_unitaire" numeric(15,4) NOT NULL,
    "date" "date" NOT NULL,
    "plus_value" numeric(15,2) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."transactions_investissement" OWNER TO "postgres";


ALTER TABLE ONLY "public"."asset_prices_cache"
    ADD CONSTRAINT "asset_prices_cache_pkey" PRIMARY KEY ("symbole");



ALTER TABLE ONLY "public"."assurances_vie"
    ADD CONSTRAINT "assurances_vie_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assurances_vie_positions"
    ADD CONSTRAINT "assurances_vie_positions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assurances_vie_valorisations"
    ADD CONSTRAINT "assurances_vie_valorisations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assurances_vie_versements"
    ADD CONSTRAINT "assurances_vie_versements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."biens_immobiliers"
    ADD CONSTRAINT "biens_immobiliers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."budgets"
    ADD CONSTRAINT "budgets_categorie_id_mois_annee_key" UNIQUE ("categorie_id", "mois", "annee");



ALTER TABLE ONLY "public"."budgets"
    ADD CONSTRAINT "budgets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cache_des_prix_des_actifs"
    ADD CONSTRAINT "cache_des_prix_des_actifs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cache_des_prix_des_actifs"
    ADD CONSTRAINT "cache_des_prix_des_actifs_ticker_key" UNIQUE ("ticker");



ALTER TABLE ONLY "public"."catalogue_actifs"
    ADD CONSTRAINT "catalogue_actifs_isin_key" UNIQUE ("isin");



ALTER TABLE ONLY "public"."catalogue_actifs"
    ADD CONSTRAINT "catalogue_actifs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."catalogue_actifs"
    ADD CONSTRAINT "catalogue_actifs_ticker_key" UNIQUE ("ticker");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comptes"
    ADD CONSTRAINT "comptes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dettes"
    ADD CONSTRAINT "dettes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dividendes"
    ADD CONSTRAINT "dividendes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."historique_patrimoine"
    ADD CONSTRAINT "historique_patrimoine_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."historique_patrimoine"
    ADD CONSTRAINT "historique_patrimoine_user_id_date_key" UNIQUE ("user_id", "date");



ALTER TABLE ONLY "public"."historique_prix_actifs"
    ADD CONSTRAINT "historique_prix_actifs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."historique_valeur_crypto"
    ADD CONSTRAINT "historique_valeur_crypto_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."historique_valeur_crypto"
    ADD CONSTRAINT "historique_valeur_crypto_user_id_date_historique_key" UNIQUE ("user_id", "date_historique");



ALTER TABLE ONLY "public"."objectifs_epargne"
    ADD CONSTRAINT "objectifs_epargne_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."objectifs_epargne"
    ADD CONSTRAINT "objectifs_epargne_user_id_mois_annee_key" UNIQUE ("user_id", "mois", "annee");



ALTER TABLE ONLY "public"."positions_crypto"
    ADD CONSTRAINT "positions_crypto_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."positions_financieres"
    ADD CONSTRAINT "positions_financieres_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."snapshot_patrimoine"
    ADD CONSTRAINT "snapshot_patrimoine_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."snapshot_patrimoine"
    ADD CONSTRAINT "snapshot_patrimoine_user_id_date_key" UNIQUE ("user_id", "date");



ALTER TABLE ONLY "public"."transactions_bourse"
    ADD CONSTRAINT "transactions_bourse_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions_crypto"
    ADD CONSTRAINT "transactions_crypto_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions_investissement"
    ADD CONSTRAINT "transactions_investissement_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."historique_prix_actifs"
    ADD CONSTRAINT "unique_actif_date" UNIQUE ("actif_id", "date");



ALTER TABLE ONLY "public"."assurances_vie_positions"
    ADD CONSTRAINT "uq_av_position_contrat_asset" UNIQUE ("contrat_id", "asset_id");



ALTER TABLE ONLY "public"."assurances_vie_valorisations"
    ADD CONSTRAINT "uq_av_valorisation_contrat_date" UNIQUE ("contrat_id", "date");



CREATE INDEX "idx_asset_prices_cache_isin" ON "public"."asset_prices_cache" USING "btree" ("isin");



CREATE INDEX "idx_asset_prices_cache_updated" ON "public"."asset_prices_cache" USING "btree" ("updated_at" DESC);



CREATE INDEX "idx_assurances_vie_user_id" ON "public"."assurances_vie" USING "btree" ("user_id");



CREATE INDEX "idx_av_positions_contrat_id" ON "public"."assurances_vie_positions" USING "btree" ("contrat_id");



CREATE INDEX "idx_av_positions_isin" ON "public"."assurances_vie_positions" USING "btree" ("isin");



CREATE INDEX "idx_av_positions_user_id" ON "public"."assurances_vie_positions" USING "btree" ("user_id");



CREATE INDEX "idx_av_valorisations_contrat_date" ON "public"."assurances_vie_valorisations" USING "btree" ("contrat_id", "date" DESC);



CREATE INDEX "idx_av_versements_contrat_id" ON "public"."assurances_vie_versements" USING "btree" ("contrat_id");



CREATE INDEX "idx_av_versements_date" ON "public"."assurances_vie_versements" USING "btree" ("date");



CREATE INDEX "idx_av_versements_user_id" ON "public"."assurances_vie_versements" USING "btree" ("user_id");



CREATE INDEX "idx_catalogue_actifs_recherche" ON "public"."catalogue_actifs" USING "gin" ("to_tsvector"('"french"'::"regconfig", (("nom" || ' '::"text") || "ticker")));



CREATE INDEX "idx_comptes_devise" ON "public"."comptes" USING "btree" ("devise");



CREATE INDEX "idx_dettes_bien_id" ON "public"."dettes" USING "btree" ("bien_immobilier_id") WHERE ("bien_immobilier_id" IS NOT NULL);



CREATE INDEX "idx_dettes_user_id" ON "public"."dettes" USING "btree" ("user_id");



CREATE INDEX "idx_historique_valeur_crypto_user_date" ON "public"."historique_valeur_crypto" USING "btree" ("user_id", "date_historique" DESC);



CREATE INDEX "idx_transactions_devise" ON "public"."transactions" USING "btree" ("devise_originale");



CREATE OR REPLACE TRIGGER "dettes_updated_at" BEFORE UPDATE ON "public"."dettes" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."assurances_vie_positions"
    ADD CONSTRAINT "assurances_vie_positions_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."catalogue_actifs"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."assurances_vie_positions"
    ADD CONSTRAINT "assurances_vie_positions_contrat_id_fkey" FOREIGN KEY ("contrat_id") REFERENCES "public"."assurances_vie"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assurances_vie_positions"
    ADD CONSTRAINT "assurances_vie_positions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assurances_vie"
    ADD CONSTRAINT "assurances_vie_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assurances_vie_valorisations"
    ADD CONSTRAINT "assurances_vie_valorisations_contrat_id_fkey" FOREIGN KEY ("contrat_id") REFERENCES "public"."assurances_vie"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assurances_vie_valorisations"
    ADD CONSTRAINT "assurances_vie_valorisations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assurances_vie_versements"
    ADD CONSTRAINT "assurances_vie_versements_contrat_id_fkey" FOREIGN KEY ("contrat_id") REFERENCES "public"."assurances_vie"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assurances_vie_versements"
    ADD CONSTRAINT "assurances_vie_versements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."biens_immobiliers"
    ADD CONSTRAINT "biens_immobiliers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."budgets"
    ADD CONSTRAINT "budgets_categorie_id_fkey" FOREIGN KEY ("categorie_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."budgets"
    ADD CONSTRAINT "budgets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."comptes"
    ADD CONSTRAINT "comptes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."dettes"
    ADD CONSTRAINT "dettes_bien_immobilier_id_fkey" FOREIGN KEY ("bien_immobilier_id") REFERENCES "public"."biens_immobiliers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."dettes"
    ADD CONSTRAINT "dettes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dividendes"
    ADD CONSTRAINT "dividendes_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "public"."positions_financieres"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dividendes"
    ADD CONSTRAINT "dividendes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."dettes"
    ADD CONSTRAINT "fk_dettes_bien" FOREIGN KEY ("bien_immobilier_id") REFERENCES "public"."biens_immobiliers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."dettes"
    ADD CONSTRAINT "fk_dettes_user" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."historique_patrimoine"
    ADD CONSTRAINT "historique_patrimoine_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."historique_prix_actifs"
    ADD CONSTRAINT "historique_prix_actifs_actif_id_fkey" FOREIGN KEY ("actif_id") REFERENCES "public"."catalogue_actifs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."historique_valeur_crypto"
    ADD CONSTRAINT "historique_valeur_crypto_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."objectifs_epargne"
    ADD CONSTRAINT "objectifs_epargne_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."positions_crypto"
    ADD CONSTRAINT "positions_crypto_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."positions_financieres"
    ADD CONSTRAINT "positions_financieres_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."snapshot_patrimoine"
    ADD CONSTRAINT "snapshot_patrimoine_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions_bourse"
    ADD CONSTRAINT "transactions_bourse_actif_id_fkey" FOREIGN KEY ("actif_id") REFERENCES "public"."catalogue_actifs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions_bourse"
    ADD CONSTRAINT "transactions_bourse_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "public"."comptes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions_bourse"
    ADD CONSTRAINT "transactions_bourse_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_categorie_id_fkey" FOREIGN KEY ("categorie_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "public"."comptes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions_crypto"
    ADD CONSTRAINT "transactions_crypto_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions_investissement"
    ADD CONSTRAINT "transactions_investissement_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "public"."positions_financieres"("id");



ALTER TABLE ONLY "public"."transactions_investissement"
    ADD CONSTRAINT "transactions_investissement_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



CREATE POLICY "Création biens" ON "public"."biens_immobiliers" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Création budgets" ON "public"."budgets" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Création catégories" ON "public"."categories" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Création dividendes" ON "public"."dividendes" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Création historique" ON "public"."historique_patrimoine" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Création objectifs" ON "public"."objectifs_epargne" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Création positions" ON "public"."positions_financieres" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Création positions crypto" ON "public"."positions_crypto" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Création transactions" ON "public"."transactions" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Insertion authentifiée dans le catalogue" ON "public"."catalogue_actifs" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Lecture biens" ON "public"."biens_immobiliers" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Lecture budgets" ON "public"."budgets" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Lecture catégories" ON "public"."categories" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Lecture dividendes" ON "public"."dividendes" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Lecture historique" ON "public"."historique_patrimoine" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Lecture objectifs" ON "public"."objectifs_epargne" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Lecture positions" ON "public"."positions_financieres" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Lecture positions crypto" ON "public"."positions_crypto" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Lecture publique cache prix" ON "public"."asset_prices_cache" FOR SELECT USING (true);



CREATE POLICY "Lecture publique de l'historique des prix" ON "public"."historique_prix_actifs" FOR SELECT USING (true);



CREATE POLICY "Lecture publique du catalogue" ON "public"."catalogue_actifs" FOR SELECT USING (true);



CREATE POLICY "Lecture transactions" ON "public"."transactions" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Les utilisateurs créent leurs propres comptes" ON "public"."comptes" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Les utilisateurs lisent leurs propres comptes" ON "public"."comptes" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Les utilisateurs modifient leurs propres comptes" ON "public"."comptes" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Les utilisateurs peuvent insérer leur propre historique crypto" ON "public"."historique_valeur_crypto" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Les utilisateurs peuvent insérer leurs propres transactions cr" ON "public"."transactions_crypto" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Les utilisateurs peuvent insérer leurs propres transactions d'" ON "public"."transactions_investissement" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Les utilisateurs peuvent modifier leur propre historique crypto" ON "public"."historique_valeur_crypto" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Les utilisateurs peuvent modifier leurs propres transactions cr" ON "public"."transactions_crypto" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Les utilisateurs peuvent modifier leurs propres transactions d'" ON "public"."transactions_investissement" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Les utilisateurs peuvent supprimer leur propre historique crypt" ON "public"."historique_valeur_crypto" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres transactions c" ON "public"."transactions_crypto" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres transactions d" ON "public"."transactions_investissement" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Les utilisateurs peuvent voir leur propre historique crypto" ON "public"."historique_valeur_crypto" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Les utilisateurs peuvent voir leurs propres transactions crypto" ON "public"."transactions_crypto" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Les utilisateurs peuvent voir leurs propres transactions d'inve" ON "public"."transactions_investissement" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Les utilisateurs suppriment leurs propres comptes" ON "public"."comptes" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Modification biens" ON "public"."biens_immobiliers" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Modification budgets" ON "public"."budgets" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Modification catégories" ON "public"."categories" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Modification historique" ON "public"."historique_patrimoine" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Modification objectifs" ON "public"."objectifs_epargne" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Modification positions" ON "public"."positions_financieres" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Modification positions crypto" ON "public"."positions_crypto" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Modification transactions" ON "public"."transactions" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Suppression biens" ON "public"."biens_immobiliers" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Suppression budgets" ON "public"."budgets" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Suppression catégories" ON "public"."categories" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Suppression dividendes" ON "public"."dividendes" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Suppression objectifs" ON "public"."objectifs_epargne" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Suppression positions" ON "public"."positions_financieres" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Suppression positions crypto" ON "public"."positions_crypto" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Suppression transactions" ON "public"."transactions" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Utilisateur gère ses transactions investissement" ON "public"."transactions_investissement" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Utilisateur voit ses snapshots" ON "public"."snapshot_patrimoine" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Utilisateur voit son profil" ON "public"."profiles" USING (("auth"."uid"() = "id"));



CREATE POLICY "Utilisateurs peuvent ajouter leurs transactions" ON "public"."transactions_bourse" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Utilisateurs peuvent modifier leurs transactions" ON "public"."transactions_bourse" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Utilisateurs peuvent supprimer leurs transactions" ON "public"."transactions_bourse" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Utilisateurs peuvent voir leurs transactions" ON "public"."transactions_bourse" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."asset_prices_cache" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assurances_vie" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assurances_vie_positions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assurances_vie_valorisations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assurances_vie_versements" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "av_delete_own" ON "public"."assurances_vie" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "av_insert_own" ON "public"."assurances_vie" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "av_positions_delete_own" ON "public"."assurances_vie_positions" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "av_positions_insert_own" ON "public"."assurances_vie_positions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "av_positions_select_own" ON "public"."assurances_vie_positions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "av_positions_update_own" ON "public"."assurances_vie_positions" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "av_select_own" ON "public"."assurances_vie" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "av_update_own" ON "public"."assurances_vie" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "av_valorisations_delete_own" ON "public"."assurances_vie_valorisations" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "av_valorisations_insert_own" ON "public"."assurances_vie_valorisations" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "av_valorisations_select_own" ON "public"."assurances_vie_valorisations" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "av_valorisations_update_own" ON "public"."assurances_vie_valorisations" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "av_versements_delete_own" ON "public"."assurances_vie_versements" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "av_versements_insert_own" ON "public"."assurances_vie_versements" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "av_versements_select_own" ON "public"."assurances_vie_versements" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "av_versements_update_own" ON "public"."assurances_vie_versements" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."biens_immobiliers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."budgets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cache_des_prix_des_actifs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."catalogue_actifs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "categories_delete" ON "public"."categories" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "categories_insert" ON "public"."categories" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "categories_select" ON "public"."categories" FOR SELECT USING ((("user_id" IS NULL) OR ("auth"."uid"() = "user_id")));



ALTER TABLE "public"."comptes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dettes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dividendes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."historique_patrimoine" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."historique_prix_actifs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."historique_valeur_crypto" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."objectifs_epargne" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."positions_crypto" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."positions_financieres" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "prices_cache_select_all" ON "public"."asset_prices_cache" FOR SELECT USING (true);



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."snapshot_patrimoine" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transactions_bourse" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transactions_crypto" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transactions_investissement" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_historique_crypto" ON "public"."historique_valeur_crypto" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "user_own_crypto_histo" ON "public"."historique_valeur_crypto" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "user_own_crypto_tx" ON "public"."transactions_crypto" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "user_transactions_bourse" ON "public"."transactions_bourse" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "user_transactions_crypto" ON "public"."transactions_crypto" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "users_own_dettes" ON "public"."dettes" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";











































































































































































GRANT ALL ON FUNCTION "public"."creer_categories_par_defaut"() TO "anon";
GRANT ALL ON FUNCTION "public"."creer_categories_par_defaut"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."creer_categories_par_defaut"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."injecter_mensualites_budget"() TO "anon";
GRANT ALL ON FUNCTION "public"."injecter_mensualites_budget"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."injecter_mensualites_budget"() TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";
























GRANT ALL ON TABLE "public"."asset_prices_cache" TO "anon";
GRANT ALL ON TABLE "public"."asset_prices_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."asset_prices_cache" TO "service_role";



GRANT ALL ON TABLE "public"."assurances_vie" TO "anon";
GRANT ALL ON TABLE "public"."assurances_vie" TO "authenticated";
GRANT ALL ON TABLE "public"."assurances_vie" TO "service_role";



GRANT ALL ON TABLE "public"."assurances_vie_positions" TO "anon";
GRANT ALL ON TABLE "public"."assurances_vie_positions" TO "authenticated";
GRANT ALL ON TABLE "public"."assurances_vie_positions" TO "service_role";



GRANT ALL ON TABLE "public"."assurances_vie_valorisations" TO "anon";
GRANT ALL ON TABLE "public"."assurances_vie_valorisations" TO "authenticated";
GRANT ALL ON TABLE "public"."assurances_vie_valorisations" TO "service_role";



GRANT ALL ON TABLE "public"."assurances_vie_versements" TO "anon";
GRANT ALL ON TABLE "public"."assurances_vie_versements" TO "authenticated";
GRANT ALL ON TABLE "public"."assurances_vie_versements" TO "service_role";



GRANT ALL ON TABLE "public"."av_valorisation_actuelle" TO "anon";
GRANT ALL ON TABLE "public"."av_valorisation_actuelle" TO "authenticated";
GRANT ALL ON TABLE "public"."av_valorisation_actuelle" TO "service_role";



GRANT ALL ON TABLE "public"."biens_immobiliers" TO "anon";
GRANT ALL ON TABLE "public"."biens_immobiliers" TO "authenticated";
GRANT ALL ON TABLE "public"."biens_immobiliers" TO "service_role";



GRANT ALL ON TABLE "public"."budgets" TO "anon";
GRANT ALL ON TABLE "public"."budgets" TO "authenticated";
GRANT ALL ON TABLE "public"."budgets" TO "service_role";



GRANT ALL ON TABLE "public"."cache_des_prix_des_actifs" TO "anon";
GRANT ALL ON TABLE "public"."cache_des_prix_des_actifs" TO "authenticated";
GRANT ALL ON TABLE "public"."cache_des_prix_des_actifs" TO "service_role";



GRANT ALL ON TABLE "public"."catalogue_actifs" TO "anon";
GRANT ALL ON TABLE "public"."catalogue_actifs" TO "authenticated";
GRANT ALL ON TABLE "public"."catalogue_actifs" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."comptes" TO "anon";
GRANT ALL ON TABLE "public"."comptes" TO "authenticated";
GRANT ALL ON TABLE "public"."comptes" TO "service_role";



GRANT ALL ON TABLE "public"."dettes" TO "anon";
GRANT ALL ON TABLE "public"."dettes" TO "authenticated";
GRANT ALL ON TABLE "public"."dettes" TO "service_role";



GRANT ALL ON TABLE "public"."dividendes" TO "anon";
GRANT ALL ON TABLE "public"."dividendes" TO "authenticated";
GRANT ALL ON TABLE "public"."dividendes" TO "service_role";



GRANT ALL ON TABLE "public"."historique_patrimoine" TO "anon";
GRANT ALL ON TABLE "public"."historique_patrimoine" TO "authenticated";
GRANT ALL ON TABLE "public"."historique_patrimoine" TO "service_role";



GRANT ALL ON TABLE "public"."historique_prix_actifs" TO "anon";
GRANT ALL ON TABLE "public"."historique_prix_actifs" TO "authenticated";
GRANT ALL ON TABLE "public"."historique_prix_actifs" TO "service_role";



GRANT ALL ON TABLE "public"."historique_valeur_crypto" TO "anon";
GRANT ALL ON TABLE "public"."historique_valeur_crypto" TO "authenticated";
GRANT ALL ON TABLE "public"."historique_valeur_crypto" TO "service_role";



GRANT ALL ON TABLE "public"."objectifs_epargne" TO "anon";
GRANT ALL ON TABLE "public"."objectifs_epargne" TO "authenticated";
GRANT ALL ON TABLE "public"."objectifs_epargne" TO "service_role";



GRANT ALL ON TABLE "public"."positions_crypto" TO "anon";
GRANT ALL ON TABLE "public"."positions_crypto" TO "authenticated";
GRANT ALL ON TABLE "public"."positions_crypto" TO "service_role";



GRANT ALL ON TABLE "public"."positions_financieres" TO "anon";
GRANT ALL ON TABLE "public"."positions_financieres" TO "authenticated";
GRANT ALL ON TABLE "public"."positions_financieres" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."snapshot_patrimoine" TO "anon";
GRANT ALL ON TABLE "public"."snapshot_patrimoine" TO "authenticated";
GRANT ALL ON TABLE "public"."snapshot_patrimoine" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";



GRANT ALL ON TABLE "public"."transactions_bourse" TO "anon";
GRANT ALL ON TABLE "public"."transactions_bourse" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions_bourse" TO "service_role";



GRANT ALL ON TABLE "public"."transactions_crypto" TO "anon";
GRANT ALL ON TABLE "public"."transactions_crypto" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions_crypto" TO "service_role";



GRANT ALL ON TABLE "public"."transactions_investissement" TO "anon";
GRANT ALL ON TABLE "public"."transactions_investissement" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions_investissement" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































drop extension if exists "pg_net";

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


