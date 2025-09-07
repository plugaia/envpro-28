-- Enable leaked password protection in Supabase Auth
-- This requires enabling the setting in Supabase dashboard at:
-- Authentication > Settings > Password Strength and Leaked Password Protection

-- Create function to validate strong passwords (backup validation)
CREATE OR REPLACE FUNCTION public.validate_password_strength(password_input text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check minimum length
  IF length(password_input) < 8 THEN
    RETURN false;
  END IF;
  
  -- Check for uppercase letter
  IF NOT (password_input ~ '[A-Z]') THEN
    RETURN false;
  END IF;
  
  -- Check for lowercase letter
  IF NOT (password_input ~ '[a-z]') THEN
    RETURN false;
  END IF;
  
  -- Check for number
  IF NOT (password_input ~ '[0-9]') THEN
    RETURN false;
  END IF;
  
  -- Check for special character
  IF NOT (password_input ~ '[^A-Za-z0-9]') THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Create rate limiting table for sensitive operations
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  action_type text NOT NULL,
  ip_address inet,
  attempts integer NOT NULL DEFAULT 1,
  window_start timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on rate_limits table
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Create policy for rate limits (only system can manage)
CREATE POLICY "Only system can manage rate limits" 
ON public.rate_limits 
FOR ALL 
USING (false);

-- Create function to check server-side rate limits
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_action_type text,
  p_max_attempts integer DEFAULT 5,
  p_window_minutes integer DEFAULT 15
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_attempts integer;
  window_start_time timestamp with time zone;
BEGIN
  -- Get current client IP (simplified - would need more robust implementation)
  window_start_time := now() - (p_window_minutes || ' minutes')::interval;
  
  -- Count attempts in current window for this user/action
  SELECT COALESCE(SUM(attempts), 0) INTO current_attempts
  FROM public.rate_limits
  WHERE user_id = auth.uid()
    AND action_type = p_action_type
    AND window_start >= window_start_time;
  
  -- If under limit, record this attempt
  IF current_attempts < p_max_attempts THEN
    INSERT INTO public.rate_limits (user_id, action_type, attempts, window_start)
    VALUES (auth.uid(), p_action_type, 1, now())
    ON CONFLICT DO NOTHING;
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Create trigger to update rate_limits updated_at
CREATE TRIGGER update_rate_limits_updated_at
  BEFORE UPDATE ON public.rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update client_contacts policies to be more restrictive
DROP POLICY IF EXISTS "Only admins can access client contacts" ON public.client_contacts;

CREATE POLICY "Admins can manage client contacts for their company proposals" 
ON public.client_contacts 
FOR ALL 
USING (
  is_admin(auth.uid()) AND 
  EXISTS (
    SELECT 1 FROM public.proposals p 
    WHERE p.id = client_contacts.proposal_id 
    AND p.company_id = get_user_company_id(auth.uid())
  )
)
WITH CHECK (
  is_admin(auth.uid()) AND 
  EXISTS (
    SELECT 1 FROM public.proposals p 
    WHERE p.id = client_contacts.proposal_id 
    AND p.company_id = get_user_company_id(auth.uid())
  )
);

-- Update team_invitations policies to allow proper access
DROP POLICY IF EXISTS "Only system functions can access team invitations" ON public.team_invitations;

CREATE POLICY "Admins can view their company team invitations" 
ON public.team_invitations 
FOR SELECT 
USING (
  is_admin(auth.uid()) AND 
  company_id = get_user_company_id(auth.uid())
);

CREATE POLICY "System functions can access team invitations for registration" 
ON public.team_invitations 
FOR SELECT 
USING (status = 'pending' AND expires_at > now());

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_action_window 
ON public.rate_limits (user_id, action_type, window_start);

CREATE INDEX IF NOT EXISTS idx_client_contacts_proposal_id 
ON public.client_contacts (proposal_id);

CREATE INDEX IF NOT EXISTS idx_team_invitations_token 
ON public.team_invitations (invitation_token);

CREATE INDEX IF NOT EXISTS idx_team_invitations_status_expires 
ON public.team_invitations (status, expires_at);

-- Create audit function for sensitive operations
CREATE OR REPLACE FUNCTION public.audit_sensitive_operation(
  p_operation_type text,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  audit_id uuid;
BEGIN
  -- Log the sensitive operation
  INSERT INTO public.audit_logs (
    user_id,
    action_type,
    table_name,
    new_data
  ) VALUES (
    auth.uid(),
    p_operation_type,
    'sensitive_operations',
    jsonb_build_object(
      'operation_type', p_operation_type,
      'details', p_details,
      'timestamp', now(),
      'user_agent', current_setting('request.headers', true)::jsonb->>'user-agent'
    )
  ) RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$;