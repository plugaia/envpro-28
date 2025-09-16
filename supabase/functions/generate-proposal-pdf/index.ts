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

    // 1. Generate a secure, single-use access token for the proposal
    const { data: tokenData, error: tokenError } = await supabase
      .rpc('create_proposal_access_token', { p_proposal_id: proposalId });
    
    if (tokenError) {
      throw new Error(`Failed to generate access token: ${tokenError.message}`);
    }
    const accessToken = tokenData;

    // 2. Construct the full public URL to the proposal page
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:8080';
    const proposalUrl = `${frontendUrl}/proposta/${proposalId}?token=${accessToken}`;
    console.log(`Navigating to URL for PDF generation: ${proposalUrl}`);

    // 3. Launch Puppeteer
    browser = await puppeteer.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
      headless: true,
    });
    
    const page = await browser.newPage();
    
    // 4. Navigate to the page and wait for it to be fully loaded
    await page.goto(proposalUrl, {
      waitUntil: 'networkidle0', // Waits until there are no more network connections for at least 500 ms
      timeout: 25000, // Increased timeout for potentially slow pages
    });

    // Optional: Wait for a specific element to ensure rendering is complete
    await page.waitForSelector('.card-elegant', { timeout: 10000 });

    // 5. Generate the PDF from the fully rendered page
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