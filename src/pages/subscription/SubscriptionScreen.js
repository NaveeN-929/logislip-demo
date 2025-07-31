import React, { useState } from 'react'
import subscriptionService from '../../services/subscriptionService'
import UPIPaymentModal from '../../components/Subscription/UPIPaymentModal'

const SubscriptionScreen = () => {
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [selectedBilling, setSelectedBilling] = useState({}) // Track billing cycle for each plan
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentPlan, setPaymentPlan] = useState({ planId: null, billingCycle: null })
  const plans = subscriptionService.getSubscriptionPlans()
  const currentSubscription = subscriptionService.getCurrentSubscription()

  // Initialize billing selections (default to monthly for paid plans)
  React.useState(() => {
    const initialBilling = {}
    Object.keys(plans).forEach(planId => {
      if (planId === 'free') {
        initialBilling[planId] = 'monthly'
      } else {
        initialBilling[planId] = 'monthly' // Default to monthly
      }
    })
    setSelectedBilling(initialBilling)
  }, [plans])

  const handleUpgrade = async (planId, billingCycle) => {
    if (planId === 'free') return

    setLoading(true)
    setSelectedPlan(`${planId}_${billingCycle}`)

    // Open UPI payment modal
    setPaymentPlan({ planId, billingCycle })
    setShowPaymentModal(true)
  }

  const handlePaymentSuccess = (result) => {
    // Show success message
    const plan = plans[result.plan.id]
    alert(`Successfully upgraded to ${plan.name} plan!`)
    setShowPaymentModal(false)
    setLoading(false)
    setSelectedPlan(null)
    
    // Refresh the page to show updated subscription
    setTimeout(() => {
      window.location.reload()
    }, 1500)
  }

  const handlePaymentModalClose = () => {
    setShowPaymentModal(false)
    setPaymentPlan({ planId: null, billingCycle: null })
    setLoading(false)
    setSelectedPlan(null)
  }

  const handleBillingChange = (planId, billingCycle) => {
    setSelectedBilling(prev => ({
      ...prev,
      [planId]: billingCycle
    }))
  }

  const formatPrice = (price, currency = 'INR') => {
    if (price === 0) return 'Free';
    
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }

  const handleCancelSubscription = async () => {
    if (window.confirm('Are you sure you want to cancel your subscription?')) {
      try {
        setLoading(true)
        await subscriptionService.cancelSubscription()
        alert('Subscription cancelled successfully')
        window.location.reload()
      } catch (error) {
        alert('Failed to cancel subscription. Please try again.')
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Choose the Perfect Plan for You</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upgrade your invoice management experience with our flexible subscription plans. 
            All plans include secure data storage and seamless Google Drive integration.
          </p>
        </div>

        {/* Current Subscription Status */}
        {currentSubscription && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Current Subscription</h3>
                <div className="flex items-center space-x-4 mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    currentSubscription?.plan?.id === 'free' 
                      ? 'bg-gray-100 text-gray-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {currentSubscription?.plan?.name || 'Free'} Plan
                  </span>
                  {currentSubscription?.plan?.id !== 'free' && currentSubscription?.endDate && (
                    <span className="text-sm text-gray-600">
                      Renews on {new Date(currentSubscription.endDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              
              {currentSubscription?.plan?.id !== 'free' && (
                <button
                  onClick={handleCancelSubscription}
                  disabled={loading}
                  className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Cancelling...' : 'Cancel Subscription'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {Object.values(plans).map((plan) => {
            const currentBilling = selectedBilling[plan.id] || 'monthly'
            const billingInfo = plan.billing[currentBilling]
            const isCurrentPlan = currentSubscription?.plan?.id === plan.id
            
            return (
              <div
                key={plan.id}
                className={`relative rounded-xl border-2 p-6 bg-white transition-all hover:shadow-lg ${
                  plan.popular 
                    ? 'border-blue-500 shadow-lg transform scale-105' 
                    : 'border-gray-200'
                } ${
                  isCurrentPlan 
                    ? 'ring-2 ring-green-500' 
                    : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1 text-sm font-medium rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute -top-4 right-4">
                    <span className="bg-green-500 text-white px-3 py-1 text-sm font-medium rounded-full">
                      Current Plan
                    </span>
                  </div>
                )}

                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>

                  {/* Billing Cycle Selector for paid plans */}
                  {plan.id !== 'free' && (
                    <div className="mb-6">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {Object.entries(plan.billing).map(([cycle, info]) => (
                          <button
                            key={cycle}
                            onClick={() => handleBillingChange(plan.id, cycle)}
                            className={`px-3 py-1 text-xs rounded-full transition-colors ${
                              currentBilling === cycle
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {info.interval}
                            {info.savings > 0 && (
                              <span className="ml-1 text-green-300">
                                -{info.savings}%
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">
                      {formatPrice(billingInfo.price, billingInfo.currency)}
                    </span>
                    {billingInfo.price > 0 && (
                      <span className="text-gray-500">/{billingInfo.interval}</span>
                    )}
                    {billingInfo.savings > 0 && (
                      <div className="text-sm text-green-600 mt-2 font-medium">
                        Save {billingInfo.savings}% vs monthly billing
                      </div>
                    )}
                  </div>

                  <ul className="text-sm text-gray-600 mb-8 space-y-3 text-left">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleUpgrade(plan.id, currentBilling)}
                    disabled={
                      loading || 
                      isCurrentPlan ||
                      (plan.id === 'free')
                    }
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                      isCurrentPlan
                        ? 'bg-green-100 text-green-700 cursor-not-allowed'
                        : plan.popular
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transform hover:scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } ${
                      loading && selectedPlan === `${plan.id}_${currentBilling}`
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    }`}
                  >
                    {loading && selectedPlan === `${plan.id}_${currentBilling}` ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </div>
                    ) : isCurrentPlan ? (
                      'Current Plan'
                    ) : plan.id === 'free' ? (
                      'Free Plan'
                    ) : (
                      `Upgrade to ${plan.name}`
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Payment Info */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-full">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span>Secure UPI payments powered by Razorpay</span>
          </div>
        </div>



        {/* Back to Dashboard */}
        <div className="text-center mt-8">

        </div>
      </div>

      {/* UPI Payment Modal */}
      <UPIPaymentModal
        isOpen={showPaymentModal}
        onClose={handlePaymentModalClose}
        planId={paymentPlan.planId}
        billingCycle={paymentPlan.billingCycle}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  )
}

export default SubscriptionScreen 