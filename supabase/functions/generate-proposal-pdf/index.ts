import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2'
import puppeteer from "https://esm.sh/puppeteer@19.7.2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GeneratePDFRequest {
  proposalId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let browser;
  try {
    const { proposalId }: GeneratePDFRequest = await req.json();
    if (!proposalId) {
      throw new Error('Proposal ID is required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: tokenData, error: tokenError } = await supabase
      .rpc('create_proposal_access_token', { p_proposal_id: proposalId });
    
    if (tokenError) {
      throw new Error(`Failed to generate access token: ${tokenError.message}`);
    }
    const accessToken = tokenData;

    const frontendUrl = Deno.env.get('FRONTEND_URL');
    if (!frontendUrl) {
      console.error('FATAL: FRONTEND_URL environment variable is not set.');
      throw new Error('Application is not configured correctly. Missing FRONTEND_URL.');
    }
    
    const proposalUrl = `${frontendUrl}/proposta/${proposalId}?token=${accessToken}`;
    console.log(`Navigating to URL for PDF generation: ${proposalUrl}`);

    browser = await puppeteer.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
      headless: true,
    });
    
    const page = await browser.newPage();
    
    await page.goto(proposalUrl, {
      waitUntil: 'networkidle0',
      timeout: 25000,
    });

    // Wait for the explicit signal from the React component that rendering is complete
    await page.waitForSelector('body[data-render-complete="true"]', { timeout: 20000 });

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

    console.log(`PDF generated successfully for proposal ${proposalId}.`);

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
    return new Response(
      JSON.stringify({ error: 'Failed to generate PDF', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});