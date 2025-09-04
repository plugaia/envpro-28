-- Add admin role to existing users who have admin role in profiles
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'admin'::app_role 
FROM public.profiles 
WHERE role = 'admin'
ON CONFLICT (user_id, role) DO NOTHING;

-- Also update the ensure_user_profile function to handle existing admin users
UPDATE public.profiles 
SET role = 'admin' 
WHERE user_id IN (
  SELECT DISTINCT user_id 
  FROM public.profiles 
  WHERE role = 'admin'
) AND role != 'admin';