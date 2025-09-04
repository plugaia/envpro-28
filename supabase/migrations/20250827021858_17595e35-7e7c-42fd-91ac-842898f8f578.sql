-- Fix critical security vulnerability: Remove public access to proposal tokens
-- This prevents attackers from enumerating all valid tokens

-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Public can view valid proposal tokens" ON public.proposal_tokens;

-- Create a restrictive policy that only allows the system functions to access tokens
-- Since get_proposal_by_token() uses SECURITY DEFINER, it can still access the table
CREATE POLICY "Only system functions can access proposal tokens" 
ON public.proposal_tokens 
FOR SELECT 
USING (false); -- This effectively blocks all direct access

-- Alternative: If we need authenticated users to access their own proposal tokens
-- we could create a more specific policy, but the current architecture doesn't require it