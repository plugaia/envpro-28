-- Remove the problematic trigger that creates profiles automatically
-- This trigger is causing conflicts with our custom profile creation edge function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.ensure_user_profile();