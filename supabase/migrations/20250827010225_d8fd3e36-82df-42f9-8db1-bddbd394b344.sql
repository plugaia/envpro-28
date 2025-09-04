-- Create proposals table
CREATE TABLE public.proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  process_number TEXT,
  organization_name TEXT,
  cedible_value NUMERIC(15,2) NOT NULL,
  proposal_value NUMERIC(15,2) NOT NULL,
  receiver_type TEXT NOT NULL CHECK (receiver_type IN ('advogado', 'autor', 'precatorio')),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'rejeitada')),
  description TEXT,
  assignee TEXT,
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view proposals from their company" 
ON public.proposals 
FOR SELECT 
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can insert proposals to their company" 
ON public.proposals 
FOR INSERT 
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update proposals from their company" 
ON public.proposals 
FOR UPDATE 
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can delete proposals from their company" 
ON public.proposals 
FOR DELETE 
USING (company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid()));

-- Add trigger for timestamps
CREATE TRIGGER update_proposals_updated_at
BEFORE UPDATE ON public.proposals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create an index for better performance
CREATE INDEX idx_proposals_company_id ON public.proposals(company_id);
CREATE INDEX idx_proposals_status ON public.proposals(status);
CREATE INDEX idx_proposals_client_phone ON public.proposals(client_phone);