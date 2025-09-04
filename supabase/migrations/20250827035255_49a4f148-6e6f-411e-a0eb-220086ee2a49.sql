-- Create audit logs table for tracking sensitive actions
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  action_type text NOT NULL,
  table_name text,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for audit logs
CREATE POLICY "Admins can view all audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (is_admin(auth.uid()) AND EXISTS (
  SELECT 1 FROM public.profiles p 
  WHERE p.user_id = auth.uid() 
  AND p.company_id = (
    SELECT company_id FROM public.profiles 
    WHERE user_id = audit_logs.user_id
  )
));

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION public.create_audit_log(
  p_action_type text,
  p_table_name text DEFAULT NULL,
  p_record_id uuid DEFAULT NULL,
  p_old_data jsonb DEFAULT NULL,
  p_new_data jsonb DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  audit_id uuid;
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action_type,
    table_name,
    record_id,
    old_data,
    new_data
  ) VALUES (
    auth.uid(),
    p_action_type,
    p_table_name,
    p_record_id,
    p_old_data,
    p_new_data
  ) RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$function$;

-- Function to export company data (for backup)
CREATE OR REPLACE FUNCTION public.export_company_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  company_id_val uuid;
  export_data jsonb;
BEGIN
  -- Check if user is admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Only admins can export company data';
  END IF;
  
  company_id_val := get_user_company_id(auth.uid());
  
  -- Build export data structure
  SELECT jsonb_build_object(
    'export_date', now(),
    'company', (
      SELECT to_jsonb(c.*) 
      FROM public.companies c 
      WHERE c.id = company_id_val
    ),
    'profiles', (
      SELECT jsonb_agg(to_jsonb(p.*))
      FROM public.profiles p 
      WHERE p.company_id = company_id_val
    ),
    'proposals', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'proposal', to_jsonb(pr.*),
          'client_contact', (
            SELECT to_jsonb(cc.*)
            FROM public.client_contacts cc
            WHERE cc.proposal_id = pr.id
          )
        )
      )
      FROM public.proposals pr 
      WHERE pr.company_id = company_id_val
    ),
    'notifications', (
      SELECT jsonb_agg(to_jsonb(n.*))
      FROM public.notifications n
      WHERE n.user_id IN (
        SELECT p.user_id 
        FROM public.profiles p 
        WHERE p.company_id = company_id_val
      )
    )
  ) INTO export_data;
  
  -- Log the export action
  PERFORM public.create_audit_log(
    'DATA_EXPORT',
    'company_data',
    company_id_val,
    NULL,
    jsonb_build_object('exported_at', now())
  );
  
  RETURN export_data;
END;
$function$;