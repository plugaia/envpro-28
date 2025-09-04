-- Fix the get_lawyer_info function SQL ambiguity error
CREATE OR REPLACE FUNCTION public.get_lawyer_info(p_proposal_id uuid)
RETURNS TABLE(first_name text, last_name text, avatar_url text, phone text, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_created_by uuid;
  v_user_email text;
BEGIN
  -- Get the proposal creator
  SELECT created_by INTO v_created_by
  FROM public.proposals 
  WHERE id = p_proposal_id;
  
  -- If proposal not found, return empty
  IF v_created_by IS NULL THEN
    RETURN;
  END IF;
  
  -- Get email from auth.users table
  SELECT u.email INTO v_user_email
  FROM auth.users u
  WHERE u.id = v_created_by;
  
  -- Return lawyer information
  RETURN QUERY
  SELECT 
    p.first_name,
    p.last_name,
    p.avatar_url,
    p.phone,
    COALESCE(v_user_email, '') as email
  FROM public.profiles p
  WHERE p.user_id = v_created_by;
END;
$function$;