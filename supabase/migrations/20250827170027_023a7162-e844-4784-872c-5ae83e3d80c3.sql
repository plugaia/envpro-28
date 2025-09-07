-- Fix the create_proposal_access_token function to use proper digest function
CREATE OR REPLACE FUNCTION public.create_proposal_access_token(p_proposal_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  access_token text;
BEGIN
  -- Generate a secure random token using md5 with random and timestamp
  access_token := md5(random()::text || clock_timestamp()::text || p_proposal_id::text);
  -- Make it URL-safe by removing any special characters
  access_token := replace(replace(replace(access_token, '+', ''), '/', ''), '=', '');
  -- Limit to 32 characters for reasonable length
  access_token := left(access_token, 32);
  
  -- Insert the token
  INSERT INTO public.proposal_tokens (proposal_id, token)
  VALUES (p_proposal_id, access_token);
  
  RETURN access_token;
END;
$function$;