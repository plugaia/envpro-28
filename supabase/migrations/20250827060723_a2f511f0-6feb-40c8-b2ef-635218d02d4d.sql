-- Force insert all admin users into user_roles table
INSERT INTO public.user_roles (user_id, role)
VALUES 
  ('d7c3b7ef-823b-47f8-9426-d49bf215a340', 'admin'),
  ('3983bc02-93c1-4f26-9b81-85dc575db222', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;