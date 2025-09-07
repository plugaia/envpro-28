-- Create function to verify phone digits securely without exposing full phone number
CREATE OR REPLACE FUNCTION public.verify_phone_digits(p_proposal_id uuid, p_last_digits text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  client_phone text;
BEGIN
  -- Get the client phone from client_contacts
  SELECT phone INTO client_phone
  FROM public.client_contacts 
  WHERE proposal_id = p_proposal_id
  LIMIT 1;
  
  -- Check if phone exists and last 4 digits match
  IF client_phone IS NOT NULL AND LENGTH(p_last_digits) = 4 THEN
    -- Extract last 4 digits from phone (removing any non-numeric characters)
    DECLARE
      phone_digits text := regexp_replace(client_phone, '[^0-9]', '', 'g');
    BEGIN
      RETURN RIGHT(phone_digits, 4) = p_last_digits;
    END;
  END IF;
  
  RETURN false;
END;
$function$;