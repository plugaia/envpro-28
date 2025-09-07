-- Fix team invitation security vulnerability
-- Remove the overly permissive policy that allows public access to all pending invitations

DROP POLICY IF EXISTS "System functions can access team invitations for registration" ON public.team_invitations;

-- The get_invitation_for_registration function already exists as SECURITY DEFINER
-- and provides controlled access to invitation data by token.
-- No direct table access is needed for the registration flow.

-- Ensure proper indexing for performance with the remaining policies
CREATE INDEX IF NOT EXISTS idx_team_invitations_company_admin 
ON public.team_invitations (company_id, invited_by) 
WHERE status = 'pending';

-- Add comment to document the security approach
COMMENT ON TABLE public.team_invitations IS 
'Team invitations table. Access is restricted to:
1. Admins can view their company invitations via RLS policy
2. Registration flow uses get_invitation_for_registration() SECURITY DEFINER function
3. No direct public access to prevent data exposure';