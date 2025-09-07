-- Enable leaked password protection for better security
-- This requires Supabase Pro plan, but is a good practice
-- Update auth configuration to enable password strength validation
UPDATE auth.config 
SET leaked_password_protection = true 
WHERE true;