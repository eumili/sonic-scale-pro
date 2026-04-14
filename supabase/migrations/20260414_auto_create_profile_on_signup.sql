-- Auto-create a `profiles` row whenever a new `auth.users` row is inserted.
--
-- Motivation: the app reads `profiles.plan` everywhere to decide Free vs Pro. If a newly
-- signed-up user has no `profiles` row (e.g. the frontend onboarding flow fails to insert
-- one), every read returns NULL and downstream code gets unpredictable behavior. This
-- trigger guarantees that `profiles.plan` exists with default 'free' the moment the auth
-- row is created.
--
-- Idempotent: ON CONFLICT DO NOTHING means re-running against existing profiles is a no-op,
-- and re-creating the trigger replaces any previous version.

-- 1. Function that runs on new auth user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, plan, plan_status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 2. Recreate the trigger to guarantee a clean state
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Backfill: make sure every existing auth.users row has a matching profile.
--    Harmless if already present thanks to ON CONFLICT.
INSERT INTO public.profiles (id, plan, plan_status)
SELECT u.id, 'free', 'active'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
