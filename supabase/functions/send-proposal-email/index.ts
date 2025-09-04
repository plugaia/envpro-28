import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'npm:resend@2.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

interface SendEmailRequest {
  proposalId: string;
  recipientEmail?: string;
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

    const { proposalId, recipientEmail }: SendEmailRequest = await req.json();

    if (!proposalId) {
      return new Response(
        JSON.stringify({ error: 'Proposal ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get proposal data (without sensitive contact info)
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select('*, companies(name)')
      .eq('id', proposalId)
      .single();

    if (proposalError || !proposal) {
      console.error('Proposal fetch error:', proposalError);
      return new Response(
        JSON.stringify({ error: 'Proposal not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get client contact data using secure function
    const { data: contactData, error: contactError } = await supabase
      .rpc('get_client_contact', { p_proposal_id: proposalId });

    if (contactError || !contactData || contactData.length === 0) {
      console.error('Contact data fetch error:', contactError);
      return new Response(
        JSON.stringify({ error: 'Contact information not accessible or not found' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const clientContact = contactData[0];

    // Generate secure access token for the proposal
    const { data: tokenData, error: tokenError } = await supabase
      .rpc('create_proposal_access_token', { p_proposal_id: proposalId });
    
    if (tokenError) {
      console.error('Token generation error:', tokenError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate secure access token' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the frontend URL from environment or use the referer header
    const frontendUrl = Deno.env.get('FRONTEND_URL') || req.headers.get('referer') || 'https://your-app-domain.com';
    // Remove trailing slash and any path from referer
    const cleanUrl = frontendUrl.replace(/\/$/, '').split('/').slice(0, 3).join('/');
    const proposalUrl = `${cleanUrl}/proposta/${proposalId}?token=${tokenData}`;
    const companyName = proposal.companies?.name || 'Empresa';
    
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    };

    const emailResponse = await resend.emails.send({
      from: `${companyName} <onboarding@resend.dev>`,
      to: [recipientEmail || clientContact.email],
      subject: `Proposta de Antecipação - ${formatCurrency(proposal.proposal_value)}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Nova Proposta de Antecipação</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="margin: 0; font-size: 28px;">Nova Proposta de Antecipação</h1>
            <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Seu futuro está nas suas mãos!</p>
          </div>

          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: #495057; margin-top: 0;">Olá, ${proposal.client_name}!</h2>
            <p>Temos uma nova proposta de antecipação de crédito judicial para você.</p>
            
            <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <span style="font-weight: bold; color: #6c757d;">Valor Cedível:</span>
                <span style="font-size: 18px; font-weight: bold;">${formatCurrency(proposal.cedible_value)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: #e3f2fd; border-radius: 6px;">
                <span style="font-weight: bold; color: #1976d2;">Proposta:</span>
                <span style="font-size: 22px; font-weight: bold; color: #1976d2;">${formatCurrency(proposal.proposal_value)}</span>
              </div>
            </div>

            ${proposal.process_number ? `<p><strong>Processo:</strong> ${proposal.process_number}</p>` : ''}
            ${proposal.organization_name ? `<p><strong>Órgão/Devedor:</strong> ${proposal.organization_name}</p>` : ''}
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${proposalUrl}" 
               style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
              📄 Visualizar Proposta Completa
            </a>
          </div>

          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin-bottom: 25px;">
            <p style="margin: 0; font-size: 14px; color: #856404;">
              <strong>🔒 Acesso Seguro:</strong> Para visualizar sua proposta, você precisará informar os últimos 4 dígitos do seu telefone cadastrado.
            </p>
          </div>

          <div style="border-top: 1px solid #dee2e6; padding-top: 20px; text-align: center; color: #6c757d; font-size: 14px;">
            <p>Esta proposta não tem força pré-contratual e está sujeita à aprovação da análise fiscal e processual.</p>
            <p>© ${new Date().getFullYear()} ${companyName} - Plataforma de Propostas Jurídicas</p>
          </div>

        </body>
        </html>
      `,
    });

    console.log('Email sent successfully:', emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: emailResponse.data?.id,
        sentTo: recipientEmail || clientContact.email
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Email send error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send email', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});