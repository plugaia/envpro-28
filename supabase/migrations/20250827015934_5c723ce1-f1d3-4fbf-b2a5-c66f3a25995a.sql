-- Create policy for public access to proposals (for viewing via links)
CREATE POLICY "Public can view proposals by ID" 
ON public.proposals 
FOR SELECT 
USING (true);  -- Allow public read access