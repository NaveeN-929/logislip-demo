// @ts-nocheck
/* eslint-disable */
// supabase edge function: phone-otp-send (simplified)
// Sets the phone number and marks as unverified. A single common OTP is used for all users.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  async function sendSmsTwilio(to: string, body: string) {
    const sid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const token = Deno.env.get('TWILIO_AUTH_TOKEN')
    const from = Deno.env.get('TWILIO_FROM_NUMBER')
    const messagingServiceSid = Deno.env.get('TWILIO_MESSAGING_SERVICE_SID')
    if (!sid || !token || (!from && !messagingServiceSid)) {
      return { sent: false, error: 'Missing Twilio SMS env (need ACCOUNT_SID, AUTH_TOKEN and either FROM_NUMBER or MESSAGING_SERVICE_SID)' }
    }

    const params = new URLSearchParams()
    params.append('To', to)
    params.append('Body', body)
    if (messagingServiceSid) {
      params.append('MessagingServiceSid', messagingServiceSid)
    } else if (from) {
      params.append('From', from)
    }

    const resp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${sid}:${token}`),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    })

    if (!resp.ok) {
      const text = await resp.text()
      console.error('Twilio SMS error:', text)
      return { sent: false, error: text }
    }
    return { sent: true }
  }

  async function sendWhatsappTwilio(to: string, body: string) {
    const sid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const token = Deno.env.get('TWILIO_AUTH_TOKEN')
    const fromWa = Deno.env.get('TWILIO_WHATSAPP_FROM') // e.g. whatsapp:+14155238886
    const messagingServiceSid = Deno.env.get('TWILIO_MESSAGING_SERVICE_SID')
    if (!sid || !token || (!fromWa && !messagingServiceSid)) {
      return { sent: false, error: 'Missing Twilio WhatsApp env (need ACCOUNT_SID, AUTH_TOKEN and either WHATSAPP_FROM or MESSAGING_SERVICE_SID)' }
    }

    const params = new URLSearchParams()
    params.append('To', to.startsWith('whatsapp:') ? to : `whatsapp:${to}`)
    params.append('Body', body)
    if (messagingServiceSid) {
      params.append('MessagingServiceSid', messagingServiceSid)
    } else if (fromWa) {
      params.append('From', fromWa.startsWith('whatsapp:') ? fromWa : `whatsapp:${fromWa}`)
    }

    const resp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${sid}:${token}`),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    })

    if (!resp.ok) {
      const text = await resp.text()
      console.error('Twilio WhatsApp error:', text)
      return { sent: false, error: text }
    }
    return { sent: true }
  }

  try {
    const { userId, phoneNumber } = await req.json()
    if (!userId || !phoneNumber) {
      return new Response(JSON.stringify({ error: 'Missing userId or phoneNumber' }), { status: 400, headers: corsHeaders })
    }
    // Basic sanitization: remove spaces, hyphens, parentheses
    const sanitizedPhone = String(phoneNumber).replace(/[\s\-()]/g, '')

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: 'Missing Supabase environment' }), { status: 500, headers: corsHeaders })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { error } = await supabase
      .from('users')
      .update({
        phone_number: sanitizedPhone,
        phone_verified: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
    }

    // Common OTP for all users
    const COMMON_OTP = Deno.env.get('COMMON_OTP') || '765265'
    const message = `Your Logislip verification code is ${COMMON_OTP}`

    // Try SMS first; if it fails, try WhatsApp (if configured)
    const smsResult = await sendSmsTwilio(sanitizedPhone, message)
    let whatsappResult: { sent: boolean; error?: string } | null = null
    if (!smsResult.sent) {
      whatsappResult = await sendWhatsappTwilio(sanitizedPhone, message)
    }

    return new Response(JSON.stringify({ ok: true, otp: COMMON_OTP, channel: smsResult.sent ? 'sms' : (whatsappResult?.sent ? 'whatsapp' : 'none'), sms: smsResult, whatsapp: whatsappResult }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders })
  }
})


