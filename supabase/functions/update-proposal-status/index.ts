// DEPRECATED: This Edge Function has been replaced by RPC function
// Use: update_proposal_status_by_token(p_access_token, p_new_status)
// This RPC function is more secure and efficient

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  return new Response(
    JSON.stringify({ 
      error: 'DEPRECATED: Use RPC function update_proposal_status_by_token instead',
      message: 'This Edge Function has been replaced by a more secure RPC function'
    }),
    { 
      status: 410, // Gone
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      }
    }
  );
});