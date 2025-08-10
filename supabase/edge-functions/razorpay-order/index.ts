// supabase edge function: razorpay-order
// Creates a Razorpay order.
// Requires secrets: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET

import Razorpay from 'npm:razorpay@2.9.6'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { amount, currency = 'INR', receipt, notes } = await req.json()

    const keyId = Deno.env.get('RAZORPAY_KEY_ID')
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')
    if (!keyId || !keySecret) {
      return new Response(JSON.stringify({ error: 'Missing Razorpay env' }), { status: 500, headers: corsHeaders })
    }

    const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret })
    const order = await rzp.orders.create({ amount, currency, receipt, notes })

    return new Response(JSON.stringify(order), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders })
  }
})