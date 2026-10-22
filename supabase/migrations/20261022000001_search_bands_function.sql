-- The two columns the band search reads, and the search function itself.
--
-- `bands` was created out of band, before this chain existed, and the
-- chain's `CREATE TABLE IF NOT EXISTS` was a no-op on it: the table was
-- already there, so the columns the chain declares were never added to it.
-- The live table had neither `formula` nor `id_new`, and both the search
-- function and the public band search read them:
--
--   * `search_bands` selected `b.formula` and `b.id_new`, so it raised
--     "column b.formula does not exist" on every call;
--   * the `search-bands` edge function called that function, and its own
--     fallback query named `formula` as well, so it answered 500 for every
--     request.
--
-- The columns are added here — `ADD COLUMN IF NOT EXISTS`, which is a no-op on
-- a database that already has them, which is every database built from the
-- chain — and the function is created with the types the chain declares.
--
-- The types matter: a `RETURNS TABLE` has to match the query exactly, or
-- Postgres refuses the result with "structure of query does not match
-- function result type". The function that was there declared `id integer`
-- while the table holds a bigint.
--
-- The return type is left as it is, and the two ids are cast to it. That is
-- not a preference: `CREATE OR REPLACE` cannot change a function's return
-- type at all — it answers "cannot change return type of existing function" —
-- so the only ways to widen it are to drop the function and create it again,
-- or to keep what the database has always declared. The ids are a bands
-- table's serial numbers, so the narrowing is not a risk, and the generated
-- types keep saying `id: number` either way.
--
-- Idempotent: `CREATE OR REPLACE` overwrites the same body.

-- ─── The columns the live table is missing ───────────────────────────────────

ALTER TABLE public.bands ADD COLUMN IF NOT EXISTS formula TEXT;
ALTER TABLE public.bands ADD COLUMN IF NOT EXISTS id_new BIGINT;

-- ─── The search function ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.search_bands(search_query text)
RETURNS TABLE(
  id integer,
  name text,
  description text,
  formula text,
  iframe_url text,
  cover_url text,
  id_new integer,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    b.id::integer,
    b.name,
    b.description,
    b.formula,
    b.iframe_url,
    b.cover_url,
    b.id_new::integer,
    b.created_at
  FROM public.bands b
  WHERE
    b.name ILIKE '%' || search_query || '%'
    OR b.description ILIKE '%' || search_query || '%'
    OR b.formula ILIKE '%' || search_query || '%'
  ORDER BY b.name;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.search_bands(text) TO anon, authenticated, service_role;
