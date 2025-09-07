-- Improve the RPC function with better error handling and logging
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
    v_client_name TEXT;
    v_proposal_value NUMERIC;
BEGIN
    -- Validate inputs
    IF p_access_token IS NULL OR trim(p_access_token) = '' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Token é obrigatório'
        );
    END IF;

    IF p_new_status IS NULL OR trim(p_new_status) = '' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Status é obrigatório'
        );
    END IF;

    -- Validate status values
    IF p_new_status NOT IN ('aprovada', 'rejeitada') THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Status deve ser "aprovada" ou "rejeitada"'
        );
    END IF;

    -- Get proposal from token with additional info
    SELECT 
        pt.proposal_id,
        pt.expires_at,
        p.status,
        p.client_name,
        p.proposal_value
    INTO 
        v_proposal_id,
        v_token_expires_at,
        v_current_status,
        v_client_name,
        v_proposal_value
    FROM proposal_tokens pt
    JOIN proposals p ON p.id = pt.proposal_id
    WHERE pt.token = p_access_token;

    -- Check if token exists
    IF v_proposal_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Token inválido ou não encontrado'
        );
    END IF;

    -- Check token expiration
    IF v_token_expires_at < NOW() THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Token expirado. Solicite um novo link.'
        );
    END IF;

    -- Check if proposal is still pending
    IF v_current_status != 'pendente' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Esta proposta já foi processada anteriormente',
            'current_status', v_current_status
        );
    END IF;

    -- Update proposal status
    UPDATE proposals 
    SET 
        status = p_new_status,
        updated_at = NOW()
    WHERE id = v_proposal_id;

    -- Check if update was successful
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Erro ao atualizar proposta'
        );
    END IF;

    -- Return success with details
    RETURN json_build_object(
        'success', true,
        'message', 'Status atualizado com sucesso',
        'proposal_id', v_proposal_id,
        'new_status', p_new_status,
        'client_name', v_client_name,
        'proposal_value', v_proposal_value,
        'updated_at', NOW()
    );

EXCEPTION
    WHEN OTHERS THEN
        -- Log error details (in production, you might want to log to a separate table)
        RAISE LOG 'Error in update_proposal_status_by_token: % %', SQLSTATE, SQLERRM;
        
        RETURN json_build_object(
            'success', false,
            'error', 'Erro interno do servidor. Tente novamente.'
        );
END;
$$;

-- Ensure proper permissions
GRANT EXECUTE ON FUNCTION update_proposal_status_by_token(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_proposal_status_by_token(TEXT, TEXT) TO anon;

-- Add helpful indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_proposal_tokens_token_expires ON proposal_tokens(token, expires_at);
CREATE INDEX IF NOT EXISTS idx_proposals_status_updated ON proposals(status, updated_at);

-- Add comment for documentation
COMMENT ON FUNCTION update_proposal_status_by_token(TEXT, TEXT) IS 
'Securely updates proposal status using access token. Used by clients to approve/reject proposals.';