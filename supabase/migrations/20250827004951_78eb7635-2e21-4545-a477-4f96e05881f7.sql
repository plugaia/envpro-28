-- Fix security warnings by setting search_path on functions
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = is_admin.user_id
      AND profiles.role = 'admin'
      AND profiles.is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_company_id(user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id
  FROM public.profiles
  WHERE profiles.user_id = get_user_company_id.user_id
    AND profiles.is_active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;