-- Idempotente : ne traite que les FK user_id -> auth.users non CASCADE.

DO $$
DECLARE r record; def text;
BEGIN
  FOR r IN
    SELECT con.conrelid::regclass AS tbl, con.conname, pg_get_constraintdef(con.oid) AS def
    FROM pg_constraint con
    JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = con.conkey[1]
    WHERE con.contype = 'f' AND con.connamespace = 'public'::regnamespace
      AND con.confrelid = 'auth.users'::regclass AND array_length(con.conkey, 1) = 1
      AND a.attname = 'user_id' AND con.confdeltype <> 'c'
  LOOP
    def := regexp_replace(r.def, ' ON DELETE (NO ACTION|RESTRICT|SET NULL|SET DEFAULT)', '', 'g');
    def := regexp_replace(def, '(REFERENCES auth\.users\(id\))', '\1 ON DELETE CASCADE');
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', r.tbl, r.conname);
    EXECUTE format('ALTER TABLE %s ADD CONSTRAINT %I %s', r.tbl, r.conname, def);
  END LOOP;
END $$;
