-- Create a trigger to automatically create a settings row when a new user signs up
-- This ensures users always have a settings row, preventing race conditions

-- Function to create default settings for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.settings (user_id, gains, volume_settings, created_at, updated_at)
  VALUES (
    NEW.id,
    '[0, 0, 0, 0, 0, 0, 0, 0, 0, 0]'::jsonb,  -- Default flat EQ
    '{"master": 70}'::jsonb,                   -- Default 70% volume
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;  -- Don't fail if row already exists

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created_settings ON auth.users;

-- Create trigger that fires after a new user is created
CREATE TRIGGER on_auth_user_created_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_settings();

-- Backfill: Create settings rows for existing users who don't have one
INSERT INTO public.settings (user_id, gains, volume_settings, created_at, updated_at)
SELECT
  id,
  '[0, 0, 0, 0, 0, 0, 0, 0, 0, 0]'::jsonb,
  '{"master": 70}'::jsonb,
  NOW(),
  NOW()
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.settings)
ON CONFLICT (user_id) DO NOTHING;

-- Add unique constraint on user_id if not exists (required for upsert)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'settings_user_id_key'
  ) THEN
    ALTER TABLE public.settings ADD CONSTRAINT settings_user_id_key UNIQUE (user_id);
  END IF;
END $$;
