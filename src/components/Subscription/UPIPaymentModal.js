import React, { useState, useEffect } from 'react'
import subscriptionService from '../../services/subscriptionService'

const UPIPaymentModal = ({ isOpen, onClose, planId, billingCycle, onPaymentSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [paymentData, setPaymentData] = useState(null)
  const [error, setError] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('pending')
  const [razorpayOrder, setRazorpayOrder] = useState(null)

  const plans = subscriptionService.getSubscriptionPlans()
  const selectedPlan = plans[planId]
  const billingInfo = selectedPlan?.billing?.[billingCycle]

  useEffect(() => {
    if (isOpen && planId && billingCycle) {
      initializePayment()
    }
  }, [isOpen, planId, billingCycle])

  const initializePayment = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await subscriptionService.createPaymentSession(planId, billingCycle, billingInfo)
      if (result.success) {
        setPaymentData(result)
        setRazorpayOrder(result.razorpayOrder)
      } else {
        setError('Failed to initialize payment. Please try again.')
      }
    } catch (err) {
      console.error('Payment initialization error:', err)
      setError('Failed to initialize payment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const payViaRazorpay = async () => {
    if (!razorpayOrder || !paymentData) return
    setLoading(true)
    try {
      const result = await subscriptionService.payWithRazorpay({
        paymentId: paymentData.paymentId,
        razorpayOrder,
        plan: paymentData.plan,
        billing: paymentData.billing
      })
      setPaymentStatus('completed')
      onPaymentSuccess && onPaymentSuccess(result)
      setTimeout(() => onClose(), 1500)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Payment failed or cancelled')
      setPaymentStatus('failed')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Complete Payment</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600" disabled={loading}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">{selectedPlan?.name} Plan</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Billing: {billingInfo?.interval}</p>
              <p className="text-lg font-bold text-gray-900">₹{billingInfo?.price?.toLocaleString()}</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>
          )}

          {loading && !paymentData && (
            <div className="text-center py-8">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-600 border-r-transparent rounded-full"></div>
              <p className="mt-2 text-gray-600">Initializing payment...</p>
            </div>
          )}

          {paymentData && (
            <>
              <div className="mb-6">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  paymentStatus === 'processing' ? 'bg-blue-100 text-blue-800' :
                  paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {paymentStatus === 'pending' && 'Waiting for Payment'}
                  {paymentStatus === 'processing' && 'Processing Payment...'}
                  {paymentStatus === 'completed' && 'Payment Successful!'}
                  {paymentStatus === 'failed' && 'Payment Failed'}
                </div>
              </div>

              {paymentStatus === 'pending' && (
                <div className="mb-6">
                  <button
                    onClick={payViaRazorpay}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    disabled={loading || !razorpayOrder}
                  >
                    {loading ? 'Opening Razorpay...' : 'Pay with Razorpay'}
                  </button>
                  <p className="text-xs text-gray-500 mt-2 text-center">Secure payments via Razorpay</p>
                </div>
              )}

              {paymentStatus === 'completed' && (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Successful!</h3>
                  <p className="text-gray-600">Your subscription has been activated.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default UPIPaymentModal