-- Fix the create_proposal_access_token function to use a working random generation method
CREATE OR REPLACE FUNCTION public.create_proposal_access_token(p_proposal_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  access_token text;
BEGIN
  -- Generate a secure random token using available functions
  access_token := encode(digest(random()::text || clock_timestamp()::text || p_proposal_id::text, 'sha256'), 'base64');
  -- Remove URL-unsafe characters and make it URL-safe
  access_token := replace(replace(replace(access_token, '+', '-'), '/', '_'), '=', '');
  -- Limit to 32 characters for reasonable length
  access_token := left(access_token, 32);
  
  -- Insert the token
  INSERT INTO public.proposal_tokens (proposal_id, token)
  VALUES (p_proposal_id, access_token);
  
  RETURN access_token;
END;
$function$;