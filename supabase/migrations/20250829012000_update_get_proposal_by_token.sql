-- Update the get_proposal_by_token function to include company logo
CREATE OR REPLACE FUNCTION get_proposal_by_token(access_token text)
RETURNS TABLE (
  id uuid,
  client_name text,
  process_number text,
  organization_name text,
  cedible_value numeric,
  proposal_value numeric,
  receiver_type text,
  status text,
  created_at timestamptz,
  valid_until timestamptz,
  description text,
  company_name text,
  company_logo_url text,
  created_by uuid
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if token is valid and not expired
  IF NOT EXISTS (
    SELECT 1 FROM proposal_tokens pt
    WHERE pt.token = access_token 
    AND pt.expires_at > NOW()
  ) THEN
    RETURN;
  END IF;

  -- Return proposal data with company info including logo
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
    p.created_at,
    p.valid_until,
    p.description,
    c.name as company_name,
    c.logo_url as company_logo_url,
    p.created_by
  FROM proposals p
  JOIN companies c ON p.company_id = c.id
  JOIN proposal_tokens pt ON p.id = pt.proposal_id
  WHERE pt.token = access_token 
  AND pt.expires_at > NOW();
END;
$$;