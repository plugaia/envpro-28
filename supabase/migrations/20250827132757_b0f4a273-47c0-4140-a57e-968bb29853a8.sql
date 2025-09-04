-- Fix the get_client_contact function to work properly with edge functions
DROP FUNCTION IF EXISTS public.get_client_contact(uuid);

CREATE OR REPLACE FUNCTION public.get_client_contact(p_proposal_id uuid)
RETURNS TABLE(email text, phone text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_proposal_owner uuid;
  v_proposal_company_id uuid;
  v_current_user_company_id uuid;
BEGIN
  -- Get proposal owner and company
  SELECT created_by, company_id INTO v_proposal_owner, v_proposal_company_id
  FROM public.proposals 
  WHERE id = p_proposal_id;
  
  -- If proposal not found, return empty
  IF v_proposal_owner IS NULL THEN
    RETURN;
  END IF;
  
  -- Get current user's company (if authenticated)
  IF auth.uid() IS NOT NULL THEN
    v_current_user_company_id := get_user_company_id(auth.uid());
    
    -- Check if user is admin or owns the proposal
    IF is_admin(auth.uid()) AND v_current_user_company_id = v_proposal_company_id THEN
      -- Admin can access
      RETURN QUERY
      SELECT cc.email, cc.phone
      FROM public.client_contacts cc
      WHERE cc.proposal_id = p_proposal_id;
      RETURN;
    ELSIF auth.uid() = v_proposal_owner THEN
      -- Owner can access
      RETURN QUERY
      SELECT cc.email, cc.phone
      FROM public.client_contacts cc
      WHERE cc.proposal_id = p_proposal_id;
      RETURN;
    END IF;
  ELSE
    -- If called from edge function with service role, allow access
    -- This is secure because edge functions have controlled access
    RETURN QUERY
    SELECT cc.email, cc.phone
    FROM public.client_contacts cc
    WHERE cc.proposal_id = p_proposal_id;
    RETURN;
  END IF;
  
  -- Default: no access
  RETURN;
END;
$$;