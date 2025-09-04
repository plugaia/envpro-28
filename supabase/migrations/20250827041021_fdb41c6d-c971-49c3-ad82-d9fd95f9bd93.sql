-- Fix search path security warnings by updating functions

-- Update validate_password_strength function
CREATE OR REPLACE FUNCTION public.validate_password_strength(password_input text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Update check_rate_limit function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_action_type text,
  p_max_attempts integer DEFAULT 5,
  p_window_minutes integer DEFAULT 15
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Update audit_sensitive_operation function
CREATE OR REPLACE FUNCTION public.audit_sensitive_operation(
  p_operation_type text,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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