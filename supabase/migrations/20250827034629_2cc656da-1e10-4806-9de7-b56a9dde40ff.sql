-- Update the get_proposal_by_token function to use the new structure
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
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Note: For security, we don't return client contact info for token-based access
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
$function$;