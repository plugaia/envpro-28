-- Enable the pgcrypto extension for generating random bytes
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Recreate the create_proposal_access_token function with proper random generation
DROP FUNCTION IF EXISTS public.create_proposal_access_token(uuid);

CREATE OR REPLACE FUNCTION public.create_proposal_access_token(p_proposal_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  access_token text;
BEGIN
  -- Generate a secure random token using pgcrypto
  access_token := encode(gen_random_bytes(32), 'base64');
  -- Remove URL-unsafe characters and make it URL-safe
  access_token := replace(replace(replace(access_token, '+', '-'), '/', '_'), '=', '');
  
  -- Insert the token
  INSERT INTO public.proposal_tokens (proposal_id, token)
  VALUES (p_proposal_id, access_token);
  
  RETURN access_token;
END;
$$;