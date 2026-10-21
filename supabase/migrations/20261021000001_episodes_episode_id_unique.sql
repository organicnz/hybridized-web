-- The episode id is the identity of an episode.
--
-- `POST /api/v1/sync-episodes` upserts with `onConflict: "episode_id"`, and
-- PostgREST turns that into `INSERT ... ON CONFLICT (episode_id) DO UPDATE`.
-- Postgres needs a unique index on the column: without one it raises 42P10 —
-- "there is no unique or exclusion constraint matching the ON CONFLICT
-- specification" — and the endpoint answers `success` while syncing nothing.
--
-- The chain had only a plain index on the column, so a database built from
-- the migrations could not serve the endpoint. The live database may already
-- have the unique index, in which case this is a no-op.
--
-- Idempotent and reconciling: where an episode was stored twice, the older
-- row is dropped, so the index can be created on a database that has
-- duplicates. The newer row wins, because it is the one the last sync wrote.

DELETE FROM public.episodes e
WHERE EXISTS (
  SELECT 1
  FROM public.episodes newer
  WHERE newer.episode_id = e.episode_id AND newer.id > e.id
);

CREATE UNIQUE INDEX IF NOT EXISTS episodes_episode_id_key ON public.episodes(episode_id);
