-- Create secure RPC function to update proposal status by token
CREATE OR REPLACE FUNCTION update_proposal_status_by_token(
    p_access_token TEXT,
    p_new_status TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_proposal_id UUID;
    v_token_expires_at TIMESTAMP WITH TIME ZONE;
    v_current_status TEXT;
BEGIN
    -- Validate inputs
    IF p_access_token IS NULL OR p_new_status IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Token e status são obrigatórios'
        );
    END IF;

    -- Validate status
    IF p_new_status NOT IN ('aprovada', 'rejeitada') THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Status inválido'
        );
    END IF;

    -- Get proposal from token
    SELECT 
        pt.proposal_id,
        pt.expires_at
    INTO 
        v_proposal_id,
        v_token_expires_at
    FROM proposal_tokens pt
    WHERE pt.token = p_access_token;

    -- Check token validity
    IF v_proposal_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Token inválido'
        );
    END IF;

    -- Check expiration
    IF v_token_expires_at < NOW() THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Token expirado'
        );
    END IF;

    -- Get current status
    SELECT status INTO v_current_status
    FROM proposals
    WHERE id = v_proposal_id;

    -- Check if already processed
    IF v_current_status IN ('aprovada', 'rejeitada') THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Proposta já foi processada'
        );
    END IF;

    -- Update proposal
    UPDATE proposals 
    SET 
        status = p_new_status,
        updated_at = NOW()
    WHERE id = v_proposal_id;

    -- Return success
    RETURN json_build_object(
        'success', true,
        'message', 'Status atualizado com sucesso',
        'proposal_id', v_proposal_id,
        'new_status', p_new_status
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Erro interno'
        );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION update_proposal_status_by_token(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_proposal_status_by_token(TEXT, TEXT) TO anon;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_proposal_tokens_token ON proposal_tokens(token);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);