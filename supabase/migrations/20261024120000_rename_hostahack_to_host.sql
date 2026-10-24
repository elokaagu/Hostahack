-- Hostahack is now Host. Renames the hostahack_* tables, indexes, constraints and sequence to host_*.
-- Fresh installs run this straight after 20261022220000_hostahack.sql; existing installs pick it up
-- with `supabase db push`.

ALTER TABLE public.hostahack_hackathons RENAME TO host_hackathons;
ALTER TABLE public.hostahack_teams RENAME TO host_teams;
ALTER TABLE public.hostahack_participants RENAME TO host_participants;
ALTER TABLE public.hostahack_submissions RENAME TO host_submissions;
ALTER TABLE public.hostahack_calls RENAME TO host_calls;

ALTER SEQUENCE public.hostahack_calls_id_seq RENAME TO host_calls_id_seq;

-- Constraints first (renaming a primary key or unique constraint also renames its index), then the
-- remaining standalone indexes.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT con.conrelid::regclass AS tbl, con.conname
    FROM pg_constraint con
    JOIN pg_namespace n ON n.oid = con.connamespace
    WHERE n.nspname = 'public' AND con.conname LIKE 'hostahack\_%'
  LOOP
    EXECUTE format('ALTER TABLE %s RENAME CONSTRAINT %I TO %I', r.tbl, r.conname, 'host_' || substr(r.conname, 11));
  END LOOP;

  FOR r IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'i' AND c.relname LIKE 'hostahack\_%'
  LOOP
    EXECUTE format('ALTER INDEX public.%I RENAME TO %I', r.relname, 'host_' || substr(r.relname, 11));
  END LOOP;
END
$$;

NOTIFY pgrst, 'reload schema';
