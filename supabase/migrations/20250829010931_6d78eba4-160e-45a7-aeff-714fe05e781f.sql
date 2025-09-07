-- Fix RLS policies for clients table to ensure proper security

-- First, drop existing policies
DROP POLICY IF EXISTS "Admins can manage clients for their company" ON public.clients;
DROP POLICY IF EXISTS "Users can create clients for their company" ON public.clients;
DROP POLICY IF EXISTS "Users can view clients from their company" ON public.clients;

-- Create comprehensive RLS policies with RESTRICTIVE mode for better security
-- Policy 1: Users can view clients from their company only
CREATE POLICY "Users can view own company clients" 
ON public.clients 
FOR SELECT 
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

-- Policy 2: Users can create clients for their company only
CREATE POLICY "Users can create own company clients" 
ON public.clients 
FOR INSERT 
TO authenticated
WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- Policy 3: Users can update clients from their company only
CREATE POLICY "Users can update own company clients" 
ON public.clients 
FOR UPDATE 
TO authenticated
USING (company_id = get_user_company_id(auth.uid()))
WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- Policy 4: Only admins can delete clients from their company
CREATE POLICY "Admins can delete own company clients" 
ON public.clients 
FOR DELETE 
TO authenticated
USING (company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid()));

-- Additional security: Ensure company_id cannot be NULL for new records
ALTER TABLE public.clients 
ALTER COLUMN company_id SET NOT NULL;