import React, { useState } from 'react'
import subscriptionService from '../../services/subscriptionService'
import UPIPaymentModal from './UPIPaymentModal'
import PlanComparisonTable from './PlanComparisonTable'

const SubscriptionPlans = ({ onClose }) => {
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [selectedBilling, setSelectedBilling] = useState({}) // Track billing cycle for each plan
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentPlan, setPaymentPlan] = useState({ planId: null, billingCycle: null })
  const plans = subscriptionService.getSubscriptionPlans()
  const currentSubscription = subscriptionService.getCurrentSubscription()

  // Initialize billing selections (default to monthly for paid plans)
  useState(() => {
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

    // Open UPI payment modal
    setPaymentPlan({ planId, billingCycle })
    setShowPaymentModal(true)
  }

  const handlePaymentSuccess = (result) => {
    // Show success message
    const plan = plans[result.plan.id]
    alert(`Successfully upgraded to ${plan.name} plan!`)
    setShowPaymentModal(false)
    onClose && onClose()
  }

  const handlePaymentModalClose = () => {
    setShowPaymentModal(false)
    setPaymentPlan({ planId: null, billingCycle: null })
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {Object.values(plans).map((plan) => {
              const currentBilling = selectedBilling[plan.id] || 'monthly'
              const billingInfo = plan.billing[currentBilling]
              const isCurrentPlan = currentSubscription?.plan?.id === plan.id
              
              return (
                <div
                  key={plan.id}
                  className={`relative rounded-lg border-2 p-6 ${
                    plan.popular 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 bg-white'
                  } ${
                    isCurrentPlan 
                      ? 'ring-2 ring-green-500' 
                      : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-500 text-white px-3 py-1 text-sm font-medium rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}

                  {isCurrentPlan && (
                    <div className="absolute -top-3 right-4">
                      <span className="bg-green-500 text-white px-3 py-1 text-sm font-medium rounded-full">
                        Current Plan
                      </span>
                    </div>
                  )}

                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {plan.name}
                    </h3>

                    {/* Billing Cycle Selector for paid plans */}
                    {plan.id !== 'free' && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {Object.entries(plan.billing).map(([cycle, info]) => (
                            <button
                              key={cycle}
                              onClick={() => handleBillingChange(plan.id, cycle)}
                              className={`px-2 py-1 text-xs rounded ${
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
                    
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-gray-900">
                        {formatPrice(billingInfo.price, billingInfo.currency)}
                      </span>
                      {billingInfo.price > 0 && (
                        <span className="text-gray-500">/{billingInfo.interval}</span>
                      )}
                      {billingInfo.savings > 0 && (
                        <div className="text-sm text-green-600 mt-1">
                          Save {billingInfo.savings}% vs monthly
                        </div>
                      )}
                    </div>

                    <ul className="text-sm text-gray-600 mb-6 space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {feature}
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
                      className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                        isCurrentPlan
                          ? 'bg-green-100 text-green-700 cursor-not-allowed'
                          : plan.popular
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
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

          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Secure payments powered by Razorpay.</p>
          </div>

          {/* Plan Comparison Table */}
          <PlanComparisonTable />
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
    </div>
  )
}

export default SubscriptionPlans 