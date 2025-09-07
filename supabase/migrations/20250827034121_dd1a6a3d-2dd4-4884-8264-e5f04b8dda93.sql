-- Now remove the sensitive columns from proposals table
ALTER TABLE public.proposals DROP COLUMN client_email;
ALTER TABLE public.proposals DROP COLUMN client_phone;

-- Update the get_user_proposals function to use the new structure
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
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if user is admin
  IF is_admin(auth.uid()) THEN
    -- Admins can see all proposals in their company with full client details
    RETURN QUERY
    SELECT 
      p.id,
      p.client_name,
      COALESCE(cc.email, 'N/A') as client_email,  -- Get from client_contacts
      COALESCE(cc.phone, 'N/A') as client_phone,  -- Get from client_contacts
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
    LEFT JOIN public.client_contacts cc ON p.id = cc.proposal_id
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
$function$;

-- Update the get_proposal_by_id function
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
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if user is admin
  IF is_admin(auth.uid()) THEN
    -- Admins can see full details
    RETURN QUERY
    SELECT 
      p.id,
      p.client_name,
      COALESCE(cc.email, 'N/A') as client_email,
      COALESCE(cc.phone, 'N/A') as client_phone,
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
    LEFT JOIN public.client_contacts cc ON p.id = cc.proposal_id
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
$function$;