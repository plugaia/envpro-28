import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'npm:resend@2.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// IMPORTANT: Make sure to set RESEND_API_KEY in your Supabase project's Edge Function secrets
const resend = new Resend(Deno.env.get('RESEND_API_KEY') ?? '')

interface SendInvitationRequest {
  email: string;
  firstName: string;
  lastName: string;
  invitationToken: string;
  inviterId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use the Service Role Key for this function.
    // The function is protected by being called after a secure RPC by an admin.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { email, firstName, lastName, invitationToken, inviterId }: SendInvitationRequest = await req.json();

    if (!email || !firstName || !lastName || !invitationToken || !inviterId) {
      return new Response(
        JSON.stringify({ error: 'Email, first name, last name, invitation token, and inviter ID are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get inviter's profile and company using the provided inviterId
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*, companies(*)')
      .eq('user_id', inviterId)
      .single();

    if (profileError || !profile) {
      console.error('Failed to get user profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to get inviter profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const companyName = profile.companies?.name || 'LegalProp';
    const inviterName = `${profile.first_name} ${profile.last_name}`;
    
    const frontendUrl = Deno.env.get('FRONTEND_URL');
    if (!frontendUrl) {
      console.error('FATAL: FRONTEND_URL environment variable is not set.');
      throw new Error('Application is not configured correctly. Missing FRONTEND_URL.');
    }
    const registrationUrl = `${frontendUrl}/convite/${invitationToken}`;

    // Send invitation email
    console.log('Attempting to send email with Resend...');
    
    const emailResponse = await resend.emails.send({
      from: `${companyName} <onboarding@resend.dev>`,
      to: [email],
      subject: `Convite para fazer parte da equipe ${companyName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Convite para Equipe</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="margin: 0; font-size: 28px;">🎉 Você foi convidado!</h1>
            <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Faça parte da nossa equipe</p>
          </div>

          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: #495057; margin-top: 0;">Olá, ${firstName}!</h2>
            <p>Você foi convidado por <strong>${inviterName}</strong> para fazer parte da equipe da <strong>${companyName}</strong>.</p>
            
            <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #495057;">Dados do convite:</h3>
              <p><strong>Nome:</strong> ${firstName} ${lastName}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Empresa:</strong> ${companyName}</p>
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${registrationUrl}" 
               style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
              🚀 Aceitar Convite e Criar Conta
            </a>
          </div>

          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin-bottom: 25px;">
            <p style="margin: 0; font-size: 14px; color: #856404;">
              <strong>⏰ Importante:</strong> Este convite expira em 7 dias. Clique no link acima para criar sua conta.
            </p>
          </div>

          <div style="border-top: 1px solid #dee2e6; padding-top: 20px; text-align: center; color: #6c757d; font-size: 14px;">
            <p>Este é um convite da plataforma ${companyName}.</p>
            <p>Se você não esperava este convite, pode ignorar este email.</p>
            <p>© ${new Date().getFullYear()} ${companyName} - Plataforma de Propostas Jurídicas</p>
          </div>

        </body>
        </html>
      `,
    });

    console.log('Invitation email sent successfully:', emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: emailResponse.data?.id,
        message: `Convite enviado para ${email}`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Team invitation error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send team invitation', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});