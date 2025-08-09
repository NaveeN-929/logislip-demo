const Razorpay = require('razorpay')

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const { amount, currency = 'INR', receipt, notes } = JSON.parse(event.body || '{}')

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Razorpay env not configured' })
      }
    }

    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    })

    const order = await instance.orders.create({
      amount: Number(amount),
      currency,
      receipt,
      notes
    })

    return {
      statusCode: 200,
      body: JSON.stringify(order)
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    }
  }
}


