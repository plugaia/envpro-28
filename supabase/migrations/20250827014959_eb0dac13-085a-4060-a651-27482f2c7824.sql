-- Add address fields to companies table
ALTER TABLE public.companies 
ADD COLUMN address_street text,
ADD COLUMN address_number text,
ADD COLUMN address_complement text,
ADD COLUMN address_neighborhood text,
ADD COLUMN address_city text,
ADD COLUMN address_state text,
ADD COLUMN address_zip_code text;