import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'
import puppeteer from "https://deno.land/x/puppeteer@17.1.1/mod.ts" // Updated Puppeteer version

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GeneratePDFRequest {
  proposalId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('PDF generation request received.');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { proposalId }: GeneratePDFRequest = await req.json();

    if (!proposalId) {
      console.error('Error: Proposal ID is required.');
      return new Response(
        JSON.stringify({ error: 'Proposal ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log(`Fetching proposal data for ID: ${proposalId}`);

    // Get proposal data (without sensitive contact info)
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select('*, companies(name, cnpj, logo_url)')
      .eq('id', proposalId)
      .single();

    if (proposalError || !proposal) {
      console.error('Proposal fetch error:', proposalError);
      return new Response(
        JSON.stringify({ error: 'Proposal not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('Proposal data fetched successfully.');

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
    console.log('Client contact data fetched successfully.');
    const clientContact = contactData[0];

    // Get lawyer information (proposal creator)
    const { data: lawyerData, error: lawyerError } = await supabase
      .from('profiles')
      .select('first_name, last_name, avatar_url, phone, user_id')
      .eq('user_id', proposal.created_by)
      .single();

    if (lawyerError) {
      console.warn('Lawyer data fetch error:', lawyerError);
    }
    console.log('Lawyer data fetched successfully (if available).');

    // Get lawyer's auth data for email
    const { data: lawyerAuth, error: lawyerAuthError } = await supabase.auth.admin.getUserById(
      proposal.created_by || ''
    );

    if (lawyerAuthError) {
      console.warn('Lawyer auth data fetch error:', lawyerAuthError);
    }

    // Use lawyer's individual phone or fallback to company phone
    let lawyerPhone = lawyerData?.phone || proposal.companies?.responsible_phone || '';
    let lawyerEmail = lawyerAuth?.user?.email || '';

    const companyName = proposal.companies?.name || 'Empresa';
    const companyCnpj = proposal.companies?.cnpj || '';
    
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    };

    const formatDate = (date: string) => {
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(date));
    };

    // Generate HTML for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Proposta ${proposalId}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; line-height: 1.6; color: #333; }
           .header { background: #667eea; color: white; padding: 30px; text-align: center; margin-bottom: 30px; position: relative; }
           .header h1 { margin: 0; font-size: 24px; }
           .header p { margin: 10px 0 0; }
           .company-logo { position: absolute; top: 20px; left: 20px; max-height: 50px; max-width: 150px; object-fit: contain; }
          .section { margin-bottom: 25px; }
          .client-info { background: #f8f9fa; padding: 20px; border-radius: 8px; }
          .process-details { border: 1px solid #dee2e6; padding: 20px; border-radius: 8px; }
          .values-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
          .value-item { text-align: center; padding: 15px; background: #f1f3f4; border-radius: 6px; }
          .value-item .label { font-size: 12px; color: #666; margin-bottom: 5px; }
          .value-item .amount { font-size: 18px; font-weight: bold; }
          .proposal-value { background: #e3f2fd; color: #1976d2; }
           .footer { border-top: 1px solid #dee2e6; padding-top: 20px; text-align: center; color: #666; font-size: 12px; }
           .disclaimer { background: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0; font-size: 14px; }
           .lawyer-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
           .lawyer-avatar { width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 10px; display: block; object-fit: cover; }
           .lawyer-details { color: #333; font-size: 14px; }
           .lawyer-details p { margin: 5px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          ${proposal.companies?.logo_url ? `<img src="${proposal.companies.logo_url}" alt="Logo da empresa" class="company-logo" />` : ''}
          <h1>Proposta de Antecipação</h1>
          <p>Seu futuro está nas suas mãos! Antecipe seus créditos judiciais.</p>
        </div>

        <div class="section client-info">
          <h2>Dados do Cliente</h2>
          <p><strong>Nome:</strong> ${proposal.client_name}</p>
          <p><strong>Email:</strong> ${clientContact.email}</p>
          <p><strong>Telefone:</strong> ${clientContact.phone}</p>
        </div>

        ${proposal.process_number || proposal.organization_name ? `
        <div class="section process-details">
          <h3>Informações do Processo</h3>
          ${proposal.process_number ? `<p><strong>Número do Processo:</strong> ${proposal.process_number}</p>` : ''}
          ${proposal.organization_name ? `<p><strong>Órgão/Devedor:</strong> ${proposal.organization_name}</p>` : ''}
          <p><strong>Tipo:</strong> ${proposal.receiver_type}</p>
        </div>
        ` : ''}

        <div class="section">
          <h3>Valores</h3>
          <div class="values-grid">
            <div class="value-item">
              <div class="label">Valor Cedível</div>
              <div class="amount">${formatCurrency(proposal.cedible_value)}</div>
            </div>
            <div class="value-item proposal-value">
              <div class="label">Proposta Aprovada</div>
              <div class="amount">${formatCurrency(proposal.proposal_value)}</div>
            </div>
          </div>
        </div>

        ${proposal.description ? `
        <div class="section">
          <h3>Descrição</h3>
          <p>${proposal.description}</p>
        </div>
        ` : ''}

        <div class="disclaimer">
          <strong>Aviso:</strong> A presente proposta não tem força pré-contratual, estando sujeita à aprovação da saúde fiscal do cedente e análise processual.
        </div>

        ${lawyerData ? `
        <div class="lawyer-info">
          <h3>Advogado Responsável</h3>
          ${lawyerData.avatar_url ? `<img src="${lawyerData.avatar_url}" alt="Foto do advogado" class="lawyer-avatar" />` : ''}
          <div class="lawyer-details">
            <p><strong>Nome:</strong> ${lawyerData.first_name} ${lawyerData.last_name}</p>
            <p><strong>Email:</strong> ${lawyerEmail}</p>
            ${lawyerPhone ? `<p><strong>WhatsApp:</strong> ${lawyerPhone}</p>` : ''}
          </div>
        </div>
        ` : ''}

        <div class="footer">
          <p><strong>Empresa:</strong> ${companyName} ${companyCnpj ? `- CNPJ: ${companyCnpj}` : ''}</p>
          <p><strong>Data de Criação:</strong> ${formatDate(proposal.created_at)}</p>
          <p><strong>Válida até:</strong> ${formatDate(proposal.valid_until)}</p>
          <p>© ${new Date().getFullYear()} ${companyName} - Plataforma de Propostas Jurídicas</p>
        </div>
      </body>
      </html>
    `;
    console.log('HTML content generated.');

    // Generate PDF using Puppeteer
    console.log('Launching browser for PDF generation...');
    const browser = await puppeteer.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-zygote',
        '--single-process'
      ]
    });
    console.log('Browser launched.');
    
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    console.log('Page content set.');
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });
    
    await browser.close();
    
    console.log('PDF generated successfully, size:', pdfBuffer.length);
    
    // Return PDF as binary response
    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="proposta-${proposalId}.pdf"`
      }
    });

  } catch (error: any) {
    console.error('PDF generation error:', error);
    console.error('Error details:', error.message); // Added for more specific error logging
    return new Response(
      JSON.stringify({ error: 'Failed to generate PDF', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});