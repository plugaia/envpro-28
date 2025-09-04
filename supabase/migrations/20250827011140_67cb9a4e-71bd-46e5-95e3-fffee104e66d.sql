-- Add created_by field to proposals table
ALTER TABLE public.proposals ADD COLUMN created_by UUID REFERENCES auth.users(id);

-- Update existing proposals to have a created_by (for demo purposes, we'll leave them null for now)
-- In a real scenario, you'd update them with appropriate user IDs

-- Drop existing policies that we need to replace
DROP POLICY IF EXISTS "Users can view proposals from their company" ON public.proposals;
DROP POLICY IF EXISTS "Users can insert proposals to their company" ON public.proposals;
DROP POLICY IF EXISTS "Users can update proposals from their company" ON public.proposals;

-- Create new policies with role-based access
-- Admins can view all proposals from their company
CREATE POLICY "Admins can view all company proposals" 
ON public.proposals 
FOR SELECT 
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND is_admin(auth.uid())
);

-- Members can only view proposals they created
CREATE POLICY "Members can view their own proposals" 
ON public.proposals 
FOR SELECT 
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND created_by = auth.uid()
);

-- Anyone can insert proposals (will be set as created_by automatically)
CREATE POLICY "Users can insert proposals to their company" 
ON public.proposals 
FOR INSERT 
WITH CHECK (
  company_id = get_user_company_id(auth.uid())
  AND created_by = auth.uid()
);

-- Admins can update all company proposals, members only their own
CREATE POLICY "Admins can update all company proposals" 
ON public.proposals 
FOR UPDATE 
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND is_admin(auth.uid())
);

CREATE POLICY "Members can update their own proposals" 
ON public.proposals 
FOR UPDATE 
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND created_by = auth.uid()
);

-- Create function to automatically set created_by on insert
CREATE OR REPLACE FUNCTION public.set_created_by_on_proposals()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to automatically set created_by
CREATE TRIGGER set_proposals_created_by
  BEFORE INSERT ON public.proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.set_created_by_on_proposals();