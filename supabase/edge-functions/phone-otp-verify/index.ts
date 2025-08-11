// @ts-nocheck
/* eslint-disable */
// supabase edge function: phone-otp-verify (simplified)
// Verifies using a single common OTP and marks phone as verified

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const { userId, phoneNumber, code } = await req.json()
    if (!userId || !phoneNumber || !code) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400, headers: corsHeaders })
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: 'Missing Supabase environment' }), { status: 500, headers: corsHeaders })
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: user, error } = await supabase
      .from('users')
      .select('id, phone_number')
      .eq('id', userId)
      .single()

    if (error || !user) {
      return new Response(JSON.stringify({ error: error?.message || 'User not found' }), { status: 404, headers: corsHeaders })
    }

    if (!user.phone_number || user.phone_number !== phoneNumber) {
      return new Response(JSON.stringify({ error: 'Phone mismatch' }), { status: 400, headers: corsHeaders })
    }

    // Single common OTP
    const COMMON_OTP = Deno.env.get('COMMON_OTP') || '123456'
    if (String(COMMON_OTP).trim() !== String(code).trim()) {
      return new Response(JSON.stringify({ error: 'Invalid OTP' }), { status: 400, headers: corsHeaders })
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({
        phone_verified: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), { status: 500, headers: corsHeaders })
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders })
  }
})


