// supabase edge function: razorpay-verify
// Verifies Razorpay signature using Web Crypto (Deno-native).
// Requires secret: RAZORPAY_KEY_SECRET

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = await req.json()

    const secret = Deno.env.get('RAZORPAY_KEY_SECRET')
    if (!secret) {
      return new Response(JSON.stringify({ error: 'Missing secret' }), { status: 500, headers: corsHeaders })
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`

    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const signature = await crypto.subtle.sign('HMAC', key, enc.encode(body))
    const expected = toHex(signature)

    const verified = expected === razorpay_signature

    return new Response(JSON.stringify({ verified }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders })
  }
})