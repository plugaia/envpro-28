import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { userId, userData } = await req.json();

    if (!userId || !userData) {
      return new Response(
        JSON.stringify({ error: 'Missing required data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existingProfile) {
      return new Response(
        JSON.stringify({ message: 'Profile already exists' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if company with CNPJ already exists
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('cnpj', userData.cnpj)
      .single();

    let company;
    if (existingCompany) {
      // Use existing company
      company = existingCompany;
    } else {
      // Create new company
      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert([
          {
            name: `Empresa - ${userData.cnpj}`,
            cnpj: userData.cnpj,
            responsible_phone: '',
            responsible_email: userData.responsibleEmail,
          }
        ])
        .select()
        .single();

      if (companyError) {
        console.error('Company creation error:', companyError);
        return new Response(
          JSON.stringify({ error: 'Failed to create company', details: companyError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      company = newCompany;
    }


    // Determine user role - admin if first user of new company, collaborator if joining existing company
    const userRole = existingCompany ? 'collaborator' : 'admin';

    // Create user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          user_id: userId,
          company_id: company.id,
          first_name: userData.firstName,
          last_name: userData.lastName,
          role: userRole,
        }
      ])
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to create profile', details: profileError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User profile created successfully:', { userId, companyId: company.id, profileId: profile.id });

    return new Response(
      JSON.stringify({ 
        success: true, 
        company: company,
        profile: profile 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});