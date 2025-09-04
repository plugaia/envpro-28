-- Fix security warnings by setting search_path on functions
ALTER FUNCTION public.create_notification(UUID, TEXT, TEXT, TEXT, JSONB) 
SET search_path = 'public';

ALTER FUNCTION public.mark_notification_read(UUID) 
SET search_path = 'public';

ALTER FUNCTION public.mark_all_notifications_read() 
SET search_path = 'public';

ALTER FUNCTION public.notify_proposal_status_change() 
SET search_path = 'public';