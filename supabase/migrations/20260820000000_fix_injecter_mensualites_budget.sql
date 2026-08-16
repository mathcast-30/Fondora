-- Fondora: correction de la fonction injecter_mensualites_budget().
--
-- La version d'origine (20260709221723_remote_schema.sql) était cassée :
--   - elle insérait dans une colonne `categorie` (texte) qui n'existe pas
--     (la table transactions utilise `categorie_id` uuid FK) ;
--   - elle utilisait `montant: -mensualite` (négatif), alors que la convention
--     du projet est montant TOUJOURS positif + champ `type` ('revenu'/'depense') ;
--   - aucun garde-fou anti-doublon (la boucle FOR réinsérait à chaque appel).
--
-- La logique d'injection des mensualités est désormais portée par le frontend
-- (useTransactions.js / useDettes.js). Cette fonction SQL est conservée comme
-- fallback idempotent au cas où elle serait appelée manuellement ou par un job
-- cron non versionné. Elle ne fait rien si une mensualité existe déjà pour le
-- couple (dette, mois courant).

CREATE OR REPLACE FUNCTION "public"."injecter_mensualites_budget"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    dette_row dettes%ROWTYPE;
    debut_mois date := date_trunc('month', CURRENT_DATE)::date;
    fin_mois date := (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::date;
    mensualite_positive numeric;
BEGIN
    FOR dette_row IN
        SELECT *
        FROM dettes
        WHERE rembourse_automatiquement = TRUE
          AND compte_id IS NOT NULL
          AND (date_debut + (duree_mois || ' months')::INTERVAL) > CURRENT_DATE
    LOOP
        -- Ignorer si une mensualité a déjà été injectée pour ce mois (anti-doublon).
        IF EXISTS (
            SELECT 1
            FROM transactions
            WHERE dette_id = dette_row.id
              AND source = 'dette_auto'
              AND date BETWEEN debut_mois AND fin_mois
        ) THEN
            CONTINUE;
        END IF;

        -- Montant positif (convention du projet). On prend la mensualité théorique ;
        -- le calcul fin (différé, in fine) reste du ressort du frontend.
        mensualite_positive := ABS(dette_row.mensualite);
        IF mensualite_positive IS NULL OR mensualite_positive <= 0 THEN
            CONTINUE;
        END IF;

        INSERT INTO transactions (
            user_id,
            compte_id,
            categorie_id,
            montant,
            description,
            type,
            date,
            source,
            dette_id,
            recurrente,
            jour_recurrence,
            recurrence_active,
            recurrence_modele
        )
        VALUES (
            dette_row.user_id,
            dette_row.compte_id,
            'c139d313-61e3-48ce-b163-968daf7926c6', -- catégorie "Crédits & Dettes"
            mensualite_positive,
            'Mensualité — ' || dette_row.nom,
            'depense',
            CURRENT_DATE,
            'dette_auto',
            dette_row.id,
            TRUE,
            EXTRACT(DAY FROM dette_row.date_debut)::int,
            TRUE,
            FALSE
        )
        ON CONFLICT DO NOTHING;
    END LOOP;
END;
$$;

ALTER FUNCTION "public"."injecter_mensualites_budget"() OWNER TO "postgres";
