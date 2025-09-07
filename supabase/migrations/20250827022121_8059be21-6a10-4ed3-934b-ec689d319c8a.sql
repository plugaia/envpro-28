-- Fix critical privacy vulnerability: Remove public access to team invitations
-- This prevents attackers from enumerating invitation tokens and harvesting personal data

-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Public can view invitations by valid token" ON public.team_invitations;

-- Create a restrictive policy that blocks all direct public access
CREATE POLICY "Only system functions can access team invitations" 
ON public.team_invitations 
FOR SELECT 
USING (false); -- This effectively blocks all direct public access

-- Create a secure function to get invitation details for registration (limited data only)
CREATE OR REPLACE FUNCTION public.get_invitation_for_registration(
  p_invitation_token text
)
RETURNS TABLE(
  invitation_id uuid,
  email text,
  first_name text,
  last_name text,
  company_name text,
  is_valid boolean
) AS $$
DECLARE
  v_invitation record;
  v_company_name text;
BEGIN
  -- Get invitation details with validation
  SELECT ti.*, c.name as company_name_val INTO v_invitation
  FROM public.team_invitations ti
  JOIN public.companies c ON ti.company_id = c.id
  WHERE ti.invitation_token = p_invitation_token
    AND ti.status = 'pending'
    AND ti.expires_at > now();
    
  IF NOT FOUND THEN
    -- Return invalid result without exposing why it failed
    RETURN QUERY SELECT 
      NULL::uuid,
      ''::text,
      ''::text, 
      ''::text,
      ''::text,
      false;
    RETURN;
  END IF;
  
  -- Return only necessary data for registration form
  RETURN QUERY SELECT 
    v_invitation.id,
    v_invitation.email,
    v_invitation.first_name,
    v_invitation.last_name,
    v_invitation.company_name_val,
    true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';