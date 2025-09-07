-- Function to update proposal status via public token access
CREATE OR REPLACE FUNCTION update_proposal_status_by_token(
  access_token text,
  new_status text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  proposal_id_var uuid;
BEGIN
  -- Validate status
  IF new_status NOT IN ('aprovada', 'rejeitada') THEN
    RETURN false;
  END IF;

  -- Check if token is valid and get proposal ID
  SELECT pt.proposal_id INTO proposal_id_var
  FROM proposal_tokens pt
  WHERE pt.token = access_token 
  AND pt.expires_at > NOW();

  IF proposal_id_var IS NULL THEN
    RETURN false;
  END IF;

  -- Update proposal status
  UPDATE proposals 
  SET 
    status = new_status,
    updated_at = NOW()
  WHERE id = proposal_id_var;

  RETURN true;
END;
$$;

-- Grant execute permission to anon users
GRANT EXECUTE ON FUNCTION update_proposal_status_by_token(text, text) TO anon;