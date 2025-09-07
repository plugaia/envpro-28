-- Enable pgcrypto extension for secure token generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Update the function to use the correct random function
CREATE OR REPLACE FUNCTION public.create_team_invitation(p_email text, p_first_name text, p_last_name text, p_whatsapp_number text DEFAULT NULL::text)
RETURNS TABLE(invitation_id uuid, invitation_token text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_company_id uuid;
  v_invitation_id uuid;
  v_token text;
BEGIN
  -- Check if user is admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Only admins can create team invitations';
  END IF;
  
  -- Get user's company ID
  v_company_id := get_user_company_id(auth.uid());
  
  -- Check if email already exists in the company
  IF EXISTS (
    SELECT 1 FROM public.profiles p 
    JOIN auth.users u ON p.user_id = u.id 
    WHERE u.email = p_email AND p.company_id = v_company_id
  ) THEN
    RAISE EXCEPTION 'User with this email already exists in your company';
  END IF;
  
  -- Generate secure token using pgcrypto extension
  v_token := encode(gen_random_bytes(32), 'base64');
  
  -- Create invitation
  INSERT INTO public.team_invitations (
    company_id,
    invited_by,
    email,
    first_name,
    last_name,
    whatsapp_number,
    invitation_token
  ) VALUES (
    v_company_id,
    auth.uid(),
    p_email,
    p_first_name,
    p_last_name,
    p_whatsapp_number,
    v_token
  ) RETURNING id INTO v_invitation_id;
  
  RETURN QUERY SELECT v_invitation_id, v_token;
END;
$function$;