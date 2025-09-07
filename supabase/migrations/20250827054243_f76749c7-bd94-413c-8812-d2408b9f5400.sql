-- Fix multi-tenancy: Each new user should create their own company and be admin
CREATE OR REPLACE FUNCTION public.ensure_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_company_id UUID;
BEGIN
  -- Check if profile already exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = NEW.id) THEN
    
    -- Create a new company for this user
    INSERT INTO public.companies (
      name,
      cnpj,
      responsible_phone,
      responsible_email
    ) VALUES (
      COALESCE(NEW.raw_user_meta_data->>'companyName', 'Minha Empresa'),
      '00.000.000/0001-00', -- Default CNPJ (will need to be updated)
      COALESCE(NEW.raw_user_meta_data->>'phone', '+55 11 99999-9999'),
      NEW.email
    ) RETURNING id INTO new_company_id;
    
    -- Create profile as admin of the new company
    INSERT INTO public.profiles (
      user_id,
      first_name,
      last_name,
      company_id,
      role -- This user becomes admin of their own company
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'firstName', 'Usuário'),
      COALESCE(NEW.raw_user_meta_data->>'lastName', ''),
      new_company_id,
      'admin' -- Make them admin of their own company
    );
    
    -- Add admin role to user_roles table
    INSERT INTO public.user_roles (
      user_id,
      role
    ) VALUES (
      NEW.id,
      'admin'
    );
    
  END IF;
  
  RETURN NEW;
END;
$function$;