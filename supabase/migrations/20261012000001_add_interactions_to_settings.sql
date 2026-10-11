-- Add last_artist and last_track columns to settings table
-- These store the user's latest interactions for cross-device restoration

ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS last_artist TEXT,
  ADD COLUMN IF NOT EXISTS last_track JSONB;

COMMENT ON COLUMN public.settings.last_artist IS 'The last artist/band the user viewed';
COMMENT ON COLUMN public.settings.last_track IS 'The last track the user was playing (JSON object with track info)';
