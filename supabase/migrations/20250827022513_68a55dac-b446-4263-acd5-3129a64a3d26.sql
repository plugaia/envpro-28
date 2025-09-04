-- Fix data privacy violation: Restrict client personal information access to admins only
-- Regular members should not see client email/phone numbers

-- Create a secure function to get proposals with role-based field access
CREATE OR REPLACE FUNCTION public.get_user_proposals()
RETURNS TABLE(
  id uuid,
  client_name text,
  client_email text,
  client_phone text,
  process_number text,
  organization_name text,
  cedible_value numeric,
  proposal_value numeric,
  valid_until timestamp with time zone,
  receiver_type text,
  status text,
  description text,
  assignee text,
  created_by uuid,
  company_id uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  can_view_client_details boolean
) AS $$
BEGIN
  -- Check if user is admin
  IF is_admin(auth.uid()) THEN
    -- Admins can see all proposals in their company with full client details
    RETURN QUERY
    SELECT 
      p.id,
      p.client_name,
      p.client_email,  -- Full access for admins
      p.client_phone,  -- Full access for admins
      p.process_number,
      p.organization_name,
      p.cedible_value,
      p.proposal_value,
      p.valid_until,
      p.receiver_type,
      p.status,
      p.description,
      p.assignee,
      p.created_by,
      p.company_id,
      p.created_at,
      p.updated_at,
      true as can_view_client_details
    FROM public.proposals p
    WHERE p.company_id = get_user_company_id(auth.uid());
  ELSE
    -- Regular members can only see their own proposals with masked client details
    RETURN QUERY
    SELECT 
      p.id,
      p.client_name,
      '***@***.***'::text as client_email,  -- Masked for regular members
      '(***) ****-****'::text as client_phone,  -- Masked for regular members
      p.process_number,
      p.organization_name,
      p.cedible_value,
      p.proposal_value,
      p.valid_until,
      p.receiver_type,
      p.status,
      p.description,
      p.assignee,
      p.created_by,
      p.company_id,
      p.created_at,
      p.updated_at,
      false as can_view_client_details
    FROM public.proposals p
    WHERE p.company_id = get_user_company_id(auth.uid())
      AND p.created_by = auth.uid();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Create a function to get a single proposal with role-based access
CREATE OR REPLACE FUNCTION public.get_proposal_by_id(p_proposal_id uuid)
RETURNS TABLE(
  id uuid,
  client_name text,
  client_email text,
  client_phone text,
  process_number text,
  organization_name text,
  cedible_value numeric,
  proposal_value numeric,
  valid_until timestamp with time zone,
  receiver_type text,
  status text,
  description text,
  assignee text,
  created_by uuid,
  company_id uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  can_view_client_details boolean
) AS $$
BEGIN
  -- Check if user is admin
  IF is_admin(auth.uid()) THEN
    -- Admins can see full details
    RETURN QUERY
    SELECT 
      p.id,
      p.client_name,
      p.client_email,
      p.client_phone,
      p.process_number,
      p.organization_name,
      p.cedible_value,
      p.proposal_value,
      p.valid_until,
      p.receiver_type,
      p.status,
      p.description,
      p.assignee,
      p.created_by,
      p.company_id,
      p.created_at,
      p.updated_at,
      true as can_view_client_details
    FROM public.proposals p
    WHERE p.id = p_proposal_id
      AND p.company_id = get_user_company_id(auth.uid());
  ELSE
    -- Regular members can only see their own proposals with masked details
    RETURN QUERY
    SELECT 
      p.id,
      p.client_name,
      '***@***.***'::text as client_email,
      '(***) ****-****'::text as client_phone,
      p.process_number,
      p.organization_name,
      p.cedible_value,
      p.proposal_value,
      p.valid_until,
      p.receiver_type,
      p.status,
      p.description,
      p.assignee,
      p.created_by,
      p.company_id,
      p.created_at,
      p.updated_at,
      false as can_view_client_details
    FROM public.proposals p
    WHERE p.id = p_proposal_id
      AND p.company_id = get_user_company_id(auth.uid())
      AND p.created_by = auth.uid();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';