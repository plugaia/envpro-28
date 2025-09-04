-- Create companies table to store company information
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  cnpj TEXT NOT NULL UNIQUE,
  responsible_phone TEXT NOT NULL,
  responsible_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('admin', 'collaborator');

-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role public.user_role NOT NULL DEFAULT 'collaborator',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create function to check if user has admin role
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = is_admin.user_id
      AND profiles.role = 'admin'
      AND profiles.is_active = true
  );
$$;

-- Create function to get user's company
CREATE OR REPLACE FUNCTION public.get_user_company_id(user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT company_id
  FROM public.profiles
  WHERE profiles.user_id = get_user_company_id.user_id
    AND profiles.is_active = true
  LIMIT 1;
$$;

-- RLS Policies for companies
CREATE POLICY "Users can view their own company" 
ON public.companies 
FOR SELECT 
USING (id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Admins can update their company" 
ON public.companies 
FOR UPDATE 
USING (id = public.get_user_company_id(auth.uid()) AND public.is_admin(auth.uid()));

-- RLS Policies for profiles
CREATE POLICY "Users can view profiles from their company" 
ON public.profiles 
FOR SELECT 
USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Admins can insert profiles for their company" 
ON public.profiles 
FOR INSERT 
WITH CHECK (company_id = public.get_user_company_id(auth.uid()) AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can update profiles from their company" 
ON public.profiles 
FOR UPDATE 
USING (company_id = public.get_user_company_id(auth.uid()) AND public.is_admin(auth.uid()));

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (user_id = auth.uid());

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();