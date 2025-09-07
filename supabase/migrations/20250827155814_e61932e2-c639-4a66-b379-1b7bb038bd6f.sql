-- Add phone field to profiles table to store individual user WhatsApp numbers
ALTER TABLE public.profiles 
ADD COLUMN phone text;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.phone IS 'User WhatsApp number for contact in proposals';