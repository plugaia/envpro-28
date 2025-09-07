-- Fix the security warning by setting search_path on the function
CREATE OR REPLACE FUNCTION public.set_created_by_on_proposals()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.created_by = auth.uid();
  RETURN NEW;
END;
$$;