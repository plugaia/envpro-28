-- Create a default company if none exists
INSERT INTO public.companies (
  name,
  cnpj,
  responsible_phone,
  responsible_email
) 
SELECT 
  'Empresa Padrão',
  '00.000.000/0001-00',
  '+55 11 99999-9999',
  'contato@stravox.com.br'
WHERE NOT EXISTS (SELECT 1 FROM public.companies LIMIT 1);

-- Create profile for the current user
INSERT INTO public.profiles (
  user_id,
  first_name,
  last_name,
  company_id,
  role
) 
SELECT 
  'd7c3b7ef-823b-47f8-9426-d49bf215a340',
  'Usuário',
  'Teste',
  (SELECT id FROM public.companies ORDER BY created_at DESC LIMIT 1),
  'admin'
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = 'd7c3b7ef-823b-47f8-9426-d49bf215a340'
);