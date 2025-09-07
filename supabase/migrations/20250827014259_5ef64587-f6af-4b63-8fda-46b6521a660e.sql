-- Function to ensure user profile exists
CREATE OR REPLACE FUNCTION public.ensure_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if profile already exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = NEW.id) THEN
    -- Create profile with default values
    INSERT INTO public.profiles (
      user_id,
      first_name,
      last_name,
      company_id
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'firstName', 'Usuário'),
      COALESCE(NEW.raw_user_meta_data->>'lastName', ''),
      -- Create a default company if none exists
      (SELECT id FROM public.companies LIMIT 1)
    );
    
    -- If no company exists, create a default one
    IF NOT EXISTS (SELECT 1 FROM public.companies LIMIT 1) THEN
      INSERT INTO public.companies (
        name,
        cnpj,
        responsible_phone,
        responsible_email
      ) VALUES (
        'Empresa Padrão',
        '00.000.000/0001-00',
        '+55 11 99999-9999',
        NEW.email
      );
      
      -- Update the profile with the new company
      UPDATE public.profiles 
      SET company_id = (SELECT id FROM public.companies ORDER BY created_at DESC LIMIT 1)
      WHERE user_id = NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Create trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.ensure_user_profile();

-- Create notification for new user signup
CREATE OR REPLACE FUNCTION public.notify_new_user_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Wait a moment to ensure profile is created first
  PERFORM pg_sleep(0.1);
  
  -- Create welcome notification
  PERFORM public.create_notification(
    NEW.id,
    'Bem-vindo ao LegalProp!',
    'Sua conta foi criada com sucesso. Comece criando sua primeira proposta jurídica.',
    'system',
    jsonb_build_object('welcome', true)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Create welcome notification trigger
CREATE TRIGGER notify_user_welcome
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_user_signup();