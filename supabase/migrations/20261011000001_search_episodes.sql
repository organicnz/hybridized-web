-- Search episodes RPC + trigram indexes
--
-- Moves /search filtering into Postgres. The search page previously loaded
-- every episode with a band join and filtered in JS; now the database
-- filters with ILIKE (semantics identical to the old JS `includes`) and
-- returns at most result_limit rows (default 50, clamped to 1–100).
--
-- Idempotent: safe to re-run.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS episodes_title_trgm_idx
  ON public.episodes USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS episodes_description_trgm_idx
  ON public.episodes USING gin (description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS episodes_creator_trgm_idx
  ON public.episodes USING gin (creator gin_trgm_ops);
CREATE INDEX IF NOT EXISTS bands_name_trgm_idx
  ON public.bands USING gin (name gin_trgm_ops);

CREATE OR REPLACE FUNCTION public.search_episodes(search_query text, result_limit integer DEFAULT 50)
RETURNS TABLE (
  id bigint,
  episode_id text,
  title text,
  description text,
  audio_url text,
  cover_url text,
  duration integer,
  pub_date timestamptz,
  band_id bigint,
  link text,
  audio_length bigint,
  creator text,
  explicit boolean,
  guid text,
  enclosure_type text,
  created_at timestamptz,
  band_name text,
  band_cover_url text,
  band_firstory_user_id text
)
LANGUAGE plpgsql
STABLE
AS $function$
DECLARE
  pattern text;
BEGIN
  -- Escape LIKE wildcards so the match stays a literal substring search
  -- (same semantics as the JS `includes` this replaces).
  pattern := '%' || replace(replace(replace(search_query, '\', '\\'), '%', '\%'), '_', '\_') || '%';

  RETURN QUERY
  SELECT
    e.id,
    e.episode_id,
    e.title,
    e.description,
    e.audio_url,
    e.cover_url,
    e.duration,
    e.pub_date,
    e.band_id,
    e.link,
    e.audio_length,
    e.creator,
    e.explicit,
    e.guid,
    e.enclosure_type,
    e.created_at,
    b.name,
    b.cover_url,
    b.firstory_user_id
  FROM public.episodes AS e
  LEFT JOIN public.bands AS b ON b.id = e.band_id
  WHERE (b.firstory_user_id IS NULL OR b.firstory_user_id NOT LIKE 'reco%')
    AND (
      e.title ILIKE pattern ESCAPE '\'
      OR e.description ILIKE pattern ESCAPE '\'
      OR e.creator ILIKE pattern ESCAPE '\'
      OR b.name ILIKE pattern ESCAPE '\'
    )
  ORDER BY e.pub_date DESC
  LIMIT LEAST(GREATEST(COALESCE(result_limit, 50), 1), 100);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.search_episodes(text, integer) TO anon, authenticated;
