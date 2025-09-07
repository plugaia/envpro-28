import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UpdateStatusRequest {
  proposalId: string;
  accessToken: string;
  newStatus: 'aprovada' | 'rejeitada';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { proposalId, accessToken, newStatus }: UpdateStatusRequest = await req.json();

    if (!proposalId || !accessToken || !newStatus) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate status
    if (!['aprovada', 'rejeitada'].includes(newStatus)) {
      return new Response(
        JSON.stringify({ error: 'Invalid status' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token is valid and matches the proposal
    const { data: tokenData, error: tokenError } = await supabase
      .from('proposal_tokens')
      .select('proposal_id, expires_at')
      .eq('token', accessToken)
      .eq('proposal_id', proposalId)
      .single();

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token is not expired
    if (new Date(tokenData.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Token expired' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update proposal status
    const { error: updateError } = await supabase
      .from('proposals')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', proposalId);

    if (updateError) {
      console.error('Error updating proposal:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update proposal' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Proposal ${proposalId} status updated to ${newStatus}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Proposal status updated to ${newStatus}` 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Update proposal status error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});