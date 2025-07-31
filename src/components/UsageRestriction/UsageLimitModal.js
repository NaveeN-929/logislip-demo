import React from 'react'
import subscriptionService from '../../services/subscriptionService'
import useSubscriptionLimits from '../../hooks/useSubscriptionLimits'

const UsageLimitModal = ({ 
  isOpen, 
  onClose, 
  onUpgrade, 
  resourceType = 'invoices',
  message = null 
}) => {
  const { getCurrentPlan, usageCounts } = useSubscriptionLimits()
  const currentPlan = getCurrentPlan()
  const plans = subscriptionService.getSubscriptionPlans()

  if (!isOpen) return null

  // Get appropriate limit based on resource type
  const getLimit = () => {
    switch (resourceType) {
      case 'clients':
        return currentPlan.limitations.clients
      case 'products':
        return currentPlan.limitations.products
      case 'invoice_exports':
      case 'invoices':
        return currentPlan.limitations.invoicesSaveExport
      case 'email_shares':
        return currentPlan.limitations.invoicesSaveExport // Pro users have same limit for email shares
      default:
        return currentPlan.limitations.invoicesSaveExport
    }
  }

  const getCurrentUsage = () => {
    return usageCounts[resourceType] || 0
  }

  const limit = getLimit()
  const currentUsage = getCurrentUsage()
  const percentage = limit === -1 ? 0 : Math.min((currentUsage / limit) * 100, 100)

  // Get resource type display name
  const getResourceDisplayName = () => {
    const names = {
      clients: 'client',
      products: 'product', 
      invoices: 'invoice',
      invoice_exports: 'invoice export',
      email_shares: 'email share'
    }
    return names[resourceType] || 'resource'
  }

  // Get next plan suggestion
  const getNextPlan = () => {
    if (currentPlan.id === 'free') return plans.pro
    if (currentPlan.id === 'pro') return plans.business
    return plans.business
  }

  const nextPlan = getNextPlan()
  const resourceName = getResourceDisplayName()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {currentPlan.name} Plan Limit Reached
          </h3>
          
          <p className="text-sm text-gray-500 mb-4">
            {message || `You've reached your limit of ${limit === -1 ? 'unlimited' : limit} ${resourceName}${limit !== 1 ? 's' : ''}. Upgrade to ${nextPlan.name} plan to ${limit === -1 ? 'continue' : `get ${nextPlan.limitations[resourceType] === -1 ? 'unlimited' : nextPlan.limitations[resourceType]} ${resourceName}${nextPlan.limitations[resourceType] !== 1 ? 's' : ''}`}.`}
          </p>

          {limit !== -1 && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Current Usage</span>
                <span className="text-sm text-gray-900">
                  {currentUsage} / {limit === -1 ? '∞' : limit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Plan Comparison */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h4 className="font-semibold text-gray-900 mb-2">Upgrade Benefits</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Current ({currentPlan.name}):</span>
                <span className="font-medium">{limit === -1 ? 'Unlimited' : limit} {resourceName}{limit !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">With {nextPlan.name}:</span>
                <span className="font-medium text-green-600">
                  {nextPlan.limitations[resourceType] === -1 ? 'Unlimited' : nextPlan.limitations[resourceType]} {resourceName}{nextPlan.limitations[resourceType] !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Maybe Later
            </button>
            <button
              onClick={onUpgrade}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Upgrade to {nextPlan.name}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UsageLimitModal 