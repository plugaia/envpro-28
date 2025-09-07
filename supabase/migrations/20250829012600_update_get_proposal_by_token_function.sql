CREATE OR REPLACE FUNCTION public.get_proposal_by_token(access_token TEXT)
RETURNS TABLE (
    id UUID,
    client_name TEXT,
    process_number TEXT,
    organization_name TEXT,
    cedible_value NUMERIC,
    proposal_value NUMERIC,
    receiver_type TEXT,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    valid_until TIMESTAMP WITH TIME ZONE,
    description TEXT,
    created_by UUID,
    company_name TEXT,
    company_logo_url TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_proposal_id UUID;
    v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Find the proposal_id and expiry date associated with the token
    SELECT pt.proposal_id, pt.expires_at
    INTO v_proposal_id, v_expires_at
    FROM public.proposal_tokens pt
    WHERE pt.token = access_token;

    -- Check if token exists and is not expired
    IF v_proposal_id IS NULL OR v_expires_at < NOW() THEN
        RETURN; -- Return empty set if token is invalid or expired
    END IF;

    -- Retrieve proposal details using the found proposal_id
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
        p.updated_at,
        p.valid_until,
        p.description,
        p.created_by,
        c.name AS company_name,
        c.logo_url AS company_logo_url
    FROM
        public.proposals p
    JOIN
        public.companies c ON p.company_id = c.id
    WHERE
        p.id = v_proposal_id;
END;
$$;