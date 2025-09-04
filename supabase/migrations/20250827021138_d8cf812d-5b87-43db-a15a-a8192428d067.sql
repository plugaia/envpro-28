-- Create team invitations table
CREATE TABLE public.team_invitations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  whatsapp_number text,
  invitation_token text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Create policies for team invitations
CREATE POLICY "Admins can manage team invitations for their company" 
ON public.team_invitations 
FOR ALL 
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND is_admin(auth.uid())
);

-- Allow public access to view invitations by token (for registration)
CREATE POLICY "Public can view invitations by valid token" 
ON public.team_invitations 
FOR SELECT 
USING (
  invitation_token IS NOT NULL 
  AND status = 'pending' 
  AND expires_at > now()
);

-- Create function to generate team invitation
CREATE OR REPLACE FUNCTION public.create_team_invitation(
  p_email text,
  p_first_name text,
  p_last_name text,
  p_whatsapp_number text DEFAULT NULL
)
RETURNS TABLE(
  invitation_id uuid,
  invitation_token text
) AS $$
DECLARE
  v_company_id uuid;
  v_invitation_id uuid;
  v_token text;
BEGIN
  -- Check if user is admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Only admins can create team invitations';
  END IF;
  
  -- Get user's company ID
  v_company_id := get_user_company_id(auth.uid());
  
  -- Check if email already exists in the company
  IF EXISTS (
    SELECT 1 FROM public.profiles p 
    JOIN auth.users u ON p.user_id = u.id 
    WHERE u.email = p_email AND p.company_id = v_company_id
  ) THEN
    RAISE EXCEPTION 'User with this email already exists in your company';
  END IF;
  
  -- Generate secure token
  v_token := encode(gen_random_bytes(32), 'base64url');
  
  -- Create invitation
  INSERT INTO public.team_invitations (
    company_id,
    invited_by,
    email,
    first_name,
    last_name,
    whatsapp_number,
    invitation_token
  ) VALUES (
    v_company_id,
    auth.uid(),
    p_email,
    p_first_name,
    p_last_name,
    p_whatsapp_number,
    v_token
  ) RETURNING id INTO v_invitation_id;
  
  RETURN QUERY SELECT v_invitation_id, v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Create function to accept team invitation
CREATE OR REPLACE FUNCTION public.accept_team_invitation(
  p_invitation_token text,
  p_user_id uuid
)
RETURNS boolean AS $$
DECLARE
  v_invitation record;
BEGIN
  -- Get invitation details
  SELECT * INTO v_invitation
  FROM public.team_invitations
  WHERE invitation_token = p_invitation_token
    AND status = 'pending'
    AND expires_at > now();
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invitation token';
  END IF;
  
  -- Create profile for the new user
  INSERT INTO public.profiles (
    user_id,
    first_name,
    last_name,
    company_id,
    role
  ) VALUES (
    p_user_id,
    v_invitation.first_name,
    v_invitation.last_name,
    v_invitation.company_id,
    'collaborator'
  );
  
  -- Mark invitation as accepted
  UPDATE public.team_invitations
  SET status = 'accepted', updated_at = now()
  WHERE id = v_invitation.id;
  
  -- Create welcome notification
  PERFORM public.create_notification(
    p_user_id,
    'Bem-vindo à equipe!',
    'Sua conta foi criada com sucesso. Você agora faz parte da equipe.',
    'system',
    jsonb_build_object('welcome', true, 'team_member', true)
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Add trigger for updated_at
CREATE TRIGGER update_team_invitations_updated_at
  BEFORE UPDATE ON public.team_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();