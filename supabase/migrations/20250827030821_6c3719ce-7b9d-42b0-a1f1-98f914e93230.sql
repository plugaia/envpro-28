-- Force enable pgcrypto extension with proper permissions
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

-- Test the function works
SELECT encode(gen_random_bytes(16), 'base64') as test;