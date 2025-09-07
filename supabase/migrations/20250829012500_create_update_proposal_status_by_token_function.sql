CREATE OR REPLACE FUNCTION public.update_proposal_status_by_token(
    p_access_token TEXT,
    p_new_status TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_proposal_id UUID;
    v_expires_at TIMESTAMP WITH TIME ZONE;
    v_current_status TEXT;
    v_client_name TEXT;
BEGIN
    -- Find the proposal_id and expiry date associated with the token
    SELECT pt.proposal_id, pt.expires_at
    INTO v_proposal_id, v_expires_at
    FROM public.proposal_tokens pt
    WHERE pt.token = p_access_token;

    -- Check if token exists
    IF v_proposal_id IS NULL THEN
        RETURN json_build_object('success', FALSE, 'error', 'Token de acesso inválido.');
    END IF;

    -- Check if token is expired
    IF v_expires_at < NOW() THEN
        RETURN json_build_object('success', FALSE, 'error', 'Token de acesso expirado.');
    END IF;

    -- Get current proposal status and client name
    SELECT p.status, p.client_name
    INTO v_current_status, v_client_name
    FROM public.proposals p
    WHERE p.id = v_proposal_id;

    -- Check if proposal exists
    IF v_current_status IS NULL THEN
        RETURN json_build_object('success', FALSE, 'error', 'Proposta não encontrada.');
    END IF;

    -- Check if status is already updated
    IF v_current_status = p_new_status THEN
        RETURN json_build_object('success', TRUE, 'message', 'Status já está atualizado.', 'client_name', v_client_name);
    END IF;

    -- Update the proposal status
    UPDATE public.proposals
    SET status = p_new_status, updated_at = NOW()
    WHERE id = v_proposal_id;

    -- Log the audit event
    PERFORM public.create_audit_log(
        p_action_type := CASE p_new_status
                            WHEN 'aprovada' THEN 'PROPOSAL_APPROVED_BY_CLIENT'
                            WHEN 'rejeitada' THEN 'PROPOSAL_REJECTED_BY_CLIENT'
                            ELSE 'PROPOSAL_STATUS_UPDATED_BY_CLIENT'
                         END,
        p_table_name := 'proposals',
        p_record_id := v_proposal_id::TEXT,
        p_new_data := json_build_object('status', p_new_status, 'client_name', v_client_name)
    );

    RETURN json_build_object('success', TRUE, 'message', 'Status da proposta atualizado com sucesso.', 'client_name', v_client_name);

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', FALSE, 'error', SQLERRM);
END;
$$;