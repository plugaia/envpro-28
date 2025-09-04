-- Fix client company_id to match the current user's company
UPDATE clients 
SET company_id = 'a6b12867-b041-45a3-90be-bcf3f3d2246e' 
WHERE company_id = '4c6b14fd-2bb0-4e06-a245-8ca21c64c23c';