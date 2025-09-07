-- Remove the overly permissive public policy
DROP POLICY IF EXISTS "Public can view proposals by ID" ON public.proposals;

-- Create a more secure approach: Create a separate table for public proposal access
CREATE TABLE public.proposal_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '30 days'),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on the new table
ALTER TABLE public.proposal_tokens ENABLE ROW LEVEL SECURITY;

-- Allow public access to valid tokens only
CREATE POLICY "Public can view valid proposal tokens" 
ON public.proposal_tokens 
FOR SELECT 
USING (expires_at > now());

-- Create function to generate secure proposal access
CREATE OR REPLACE FUNCTION public.create_proposal_access_token(p_proposal_id uuid)
RETURNS text AS $$
DECLARE
  access_token text;
BEGIN
  -- Generate a secure random token
  access_token := encode(gen_random_bytes(32), 'base64url');
  
  -- Insert the token
  INSERT INTO public.proposal_tokens (proposal_id, token)
  VALUES (p_proposal_id, access_token);
  
  RETURN access_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Create function to get proposal data by token (with limited data exposure)
CREATE OR REPLACE FUNCTION public.get_proposal_by_token(access_token text)
RETURNS TABLE(
  id uuid,
  client_name text,
  process_number text,
  organization_name text,
  cedible_value numeric,
  proposal_value numeric,
  receiver_type text,
  status text,
  valid_until timestamp with time zone,
  created_at timestamp with time zone,
  company_name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.client_name,
    p.process_number,
    p.organization_name,
    p.cedible_value,
    p.proposal_value,
    p.receiver_type,
    p.status,
    p.valid_until,
    p.created_at,
    c.name as company_name
  FROM public.proposals p
  JOIN public.companies c ON p.company_id = c.id
  JOIN public.proposal_tokens pt ON pt.proposal_id = p.id
  WHERE pt.token = access_token
    AND pt.expires_at > now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';