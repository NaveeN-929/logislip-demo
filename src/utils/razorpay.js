// Lazy-load Razorpay Checkout script and expose a promise-based loader
let razorpayScriptPromise = null

export function loadRazorpayCheckout() {
  if (typeof window !== 'undefined' && window.Razorpay) {
    return Promise.resolve(true)
  }

  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = () => resolve(true)
      script.onerror = () => reject(new Error('Failed to load Razorpay script'))
      document.body.appendChild(script)
    })
  }

  return razorpayScriptPromise
}

export function openRazorpayCheckout(options) {
  if (!window.Razorpay) {
    throw new Error('Razorpay is not loaded')
  }
  const rzp = new window.Razorpay(options)
  rzp.open()
  return rzp
}


