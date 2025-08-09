const crypto = require('crypto')

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, payment_id } = JSON.parse(event.body || '{}')

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Missing key secret' }) }
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex')

    const verified = expectedSignature === razorpay_signature

    return {
      statusCode: 200,
      body: JSON.stringify({ verified, payment_id })
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    }
  }
}


