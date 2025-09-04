-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, email)
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create policies for clients
CREATE POLICY "Users can view clients from their company" 
ON public.clients 
FOR SELECT 
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can manage clients for their company" 
ON public.clients 
FOR ALL 
USING (company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid()))
WITH CHECK (company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid()));

CREATE POLICY "Users can create clients for their company" 
ON public.clients 
FOR INSERT 
WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- Add client_id to client_contacts table
ALTER TABLE public.client_contacts ADD COLUMN client_id UUID REFERENCES public.clients(id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_clients_updated_at();

-- Migrate existing client data
INSERT INTO public.clients (company_id, name, email, phone)
SELECT DISTINCT p.company_id, p.client_name, cc.email, cc.phone
FROM proposals p
JOIN client_contacts cc ON p.id = cc.proposal_id
ON CONFLICT (company_id, email) DO NOTHING;