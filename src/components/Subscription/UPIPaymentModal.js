import React, { useState, useEffect } from 'react'
import QRCode from 'react-qr-code'
import subscriptionService from '../../services/subscriptionService'

const UPIPaymentModal = ({ isOpen, onClose, planId, billingCycle, onPaymentSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [paymentData, setPaymentData] = useState(null)
  const [error, setError] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('pending') // pending, processing, completed, failed
  const [transactionId, setTransactionId] = useState('')
  const [qrCodeGenerated, setQrCodeGenerated] = useState(false)

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
        setQrCodeGenerated(true)
        // Start polling for payment status
        startPaymentStatusPolling(result.paymentId)
      } else {
        setError('Failed to initialize payment. Please try again.')
      }
    } catch (error) {
      console.error('Payment initialization error:', error)
      setError('Failed to initialize payment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const startPaymentStatusPolling = (paymentId) => {
    // Poll payment status every 5 seconds
    const pollInterval = setInterval(async () => {
      try {
        // This would be implemented to check payment status from Supabase
        // For now, we'll simulate the polling
        if (paymentStatus === 'completed') {
          clearInterval(pollInterval)
        }
      } catch (error) {
        console.error('Payment status polling error:', error)
      }
    }, 5000)

    // Clear polling after 10 minutes
    setTimeout(() => {
      clearInterval(pollInterval)
    }, 600000)
  }

  const handleManualConfirmation = async () => {
    if (!transactionId.trim()) {
      setError('Please enter the transaction ID')
      return
    }

    setLoading(true)
    setPaymentStatus('processing')

    try {
      const result = await subscriptionService.confirmPayment(paymentData.paymentId, transactionId)
      
      if (result.success) {
        setPaymentStatus('completed')
        onPaymentSuccess && onPaymentSuccess(result)
        
        setTimeout(() => {
          onClose()
        }, 2000)
      } else {
        setError('Payment confirmation failed. Please contact support.')
        setPaymentStatus('failed')
      }
    } catch (error) {
      console.error('Payment confirmation error:', error)
      setError('Payment confirmation failed. Please try again.')
      setPaymentStatus('failed')
    } finally {
      setLoading(false)
    }
  }

  const copyUPIId = () => {
    if (paymentData?.upiDetails?.merchantId) {
      navigator.clipboard.writeText(paymentData.upiDetails.merchantId)
      alert('UPI ID copied to clipboard!')
    }
  }

  const copyAmount = () => {
    if (paymentData?.upiDetails?.amount) {
      navigator.clipboard.writeText(paymentData.upiDetails.amount.toString())
      alert('Amount copied to clipboard!')
    }
  }

  const openUPIApp = () => {
    if (paymentData?.upiDetails?.upiUrl) {
      window.open(paymentData.upiDetails.upiUrl, '_blank')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Complete Payment</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={loading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Plan Details */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">{selectedPlan?.name} Plan</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Billing: {billingInfo?.interval}</p>
              <p className="text-lg font-bold text-gray-900">
                ₹{billingInfo?.price?.toLocaleString()} 
                {billingInfo?.savings > 0 && (
                  <span className="text-sm text-green-600 ml-2">
                    (Save {billingInfo.savings}%)
                  </span>
                )}
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {loading && !paymentData && (
            <div className="text-center py-8">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-600 border-r-transparent rounded-full"></div>
              <p className="mt-2 text-gray-600">Initializing payment...</p>
            </div>
          )}

          {paymentData && (
            <>
              {/* Payment Status */}
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
                <>
                  {/* QR Code Section */}
                  <div className="mb-6 text-center">
                    <h4 className="font-semibold text-gray-900 mb-3">Scan QR Code with any UPI App</h4>
                    <div className="inline-block p-4 bg-white border-2 border-dashed border-gray-300 rounded-lg">
                      {qrCodeGenerated && paymentData?.upiDetails?.qrCodeData ? (
                        <div className="w-48 h-48 flex items-center justify-center">
                          <QRCode
                            value={paymentData.upiDetails.qrCodeData}
                            size={192}
                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                            level="M"
                          />
                        </div>
                      ) : (
                        <div className="w-48 h-48 flex items-center justify-center">
                          <div className="animate-pulse text-gray-400">Generating QR...</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* UPI Payment Details */}
                  <div className="mb-6 space-y-3">
                    <h4 className="font-semibold text-gray-900">Or pay manually using UPI</h4>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="text-xs text-gray-500">UPI ID</p>
                        <p className="font-medium">{paymentData.upiDetails?.merchantId}</p>
                      </div>
                      <button
                        onClick={copyUPIId}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        Copy
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="text-xs text-gray-500">Amount</p>
                        <p className="font-medium">₹{paymentData.upiDetails?.amount}</p>
                      </div>
                      <button
                        onClick={copyAmount}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        Copy
                      </button>
                    </div>

                    <div className="p-3 bg-gray-50 rounded">
                      <p className="text-xs text-gray-500">Transaction Note</p>
                      <p className="font-medium text-sm">{paymentData.upiDetails?.transactionNote}</p>
                    </div>
                  </div>

                  {/* UPI App Button */}
                  <button
                    onClick={openUPIApp}
                    className="w-full mb-4 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Open UPI App
                  </button>

                  {/* Manual Confirmation */}
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Confirm Payment</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      After making the payment, enter the transaction ID to confirm:
                    </p>
                    
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Enter UPI Transaction ID"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      
                      <button
                        onClick={handleManualConfirmation}
                        disabled={loading || !transactionId.trim()}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {loading ? 'Confirming...' : 'Confirm Payment'}
                      </button>
                    </div>
                  </div>
                </>
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