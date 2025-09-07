-- Create client_contacts table for sensitive data
CREATE TABLE public.client_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint to ensure one contact per proposal
ALTER TABLE public.client_contacts ADD CONSTRAINT unique_proposal_contact UNIQUE (proposal_id);

-- Enable RLS on client_contacts
ALTER TABLE public.client_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins can access client contacts
CREATE POLICY "Only admins can access client contacts" 
ON public.client_contacts 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Migrate existing data from proposals to client_contacts
INSERT INTO public.client_contacts (proposal_id, email, phone)
SELECT id, client_email, client_phone 
FROM public.proposals 
WHERE client_email IS NOT NULL AND client_phone IS NOT NULL;

-- Create function to get client contact for authorized users
CREATE OR REPLACE FUNCTION public.get_client_contact(p_proposal_id uuid)
RETURNS TABLE(email text, phone text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if user is admin or owns the proposal
  IF is_admin(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.proposals 
    WHERE id = p_proposal_id AND created_by = auth.uid()
  ) THEN
    RETURN QUERY
    SELECT cc.email, cc.phone
    FROM public.client_contacts cc
    WHERE cc.proposal_id = p_proposal_id;
  ELSE
    -- Return empty result for unauthorized users
    RETURN;
  END IF;
END;
$function$;

-- Add trigger for updated_at on client_contacts
CREATE TRIGGER update_client_contacts_updated_at
  BEFORE UPDATE ON public.client_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Remove client_email and client_phone columns from proposals table
-- (We'll do this in a separate step after updating the code)
-- ALTER TABLE public.proposals DROP COLUMN client_email;
-- ALTER TABLE public.proposals DROP COLUMN client_phone;