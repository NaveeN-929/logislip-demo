import { useState, useEffect, useCallback } from 'react'
import subscriptionService from '../services/subscriptionService'
import userService from '../services/userService'

const useSubscriptionLimits = () => {
  const [usageCounts, setUsageCounts] = useState({
    clients: 0,
    products: 0,
    invoices: 0,
    invoice_exports: 0,
    email_shares: 0
  })
  const [loading, setLoading] = useState(true)

  // Get real-time usage counts (called every time we need fresh data)
  const getRealTimeUsageCounts = useCallback(() => {
    try {
      // Get counts from localStorage using the actual keys used by the app
      const clients = JSON.parse(localStorage.getItem('clients') || '[]')
      const products = JSON.parse(localStorage.getItem('products') || '[]')
      const invoices = JSON.parse(localStorage.getItem('invoices') || '[]')
      
      // For exports and email shares, we track these in separate counters
      const exportCount = parseInt(localStorage.getItem('invoice_export_count') || '0')
      const emailShareCount = parseInt(localStorage.getItem('email_share_count') || '0')

      return {
        clients: clients.length,
        products: products.length,
        invoices: invoices.length,
        invoice_exports: exportCount,
        email_shares: emailShareCount
      }
    } catch (error) {
      console.error('Error getting real-time usage counts:', error)
      return {
        clients: 0,
        products: 0,
        invoices: 0,
        invoice_exports: 0,
        email_shares: 0
      }
    }
  }, [])

  // Load current usage counts
  const loadUsageCounts = useCallback(async () => {
    setLoading(true)
    try {
      const counts = getRealTimeUsageCounts()
      setUsageCounts(counts)
    } catch (error) {
      console.error('Error loading usage counts:', error)
    } finally {
      setLoading(false)
    }
  }, [getRealTimeUsageCounts])

  // Load counts on mount
  useEffect(() => {
    loadUsageCounts()
  }, [loadUsageCounts])

  // Check if user can create a resource (gets fresh count every time)
  const canCreateResource = useCallback((resourceType) => {
    const canCreate = subscriptionService.canCreateResource(resourceType)
    return canCreate
  }, [])

  // Check if user can export with specific format (gets fresh count every time)
  const canExportFormat = useCallback((format) => {
    const canExport = subscriptionService.canExportFormat(format)
    return canExport
  }, [])

  // Check if user can use specific template
  const canUseTemplate = useCallback((templateName) => {
    return subscriptionService.canUseTemplate(templateName)
  }, [])

  // Check if user can share via email (gets fresh count every time)
  const canShareViaEmail = useCallback(() => {
    const canShare = subscriptionService.canShareViaEmail()
    return canShare
  }, [])

  // Get resource limits for current plan
  const getResourceLimits = useCallback(() => {
    return subscriptionService.getResourceLimits()
  }, [])

  // Show usage limit modal if limit reached
  const showLimitModal = useCallback((resourceType, onUpgrade) => {
    const user = userService.getCurrentUser()
    const plans = subscriptionService.getSubscriptionPlans()
    const currentPlan = plans[user?.subscription_tier] || plans.free
    const currentCounts = getRealTimeUsageCounts()
    const currentCount = currentCounts[resourceType] || 0
    const limit = currentPlan.limitations[resourceType] || currentPlan.limitations.invoicesSaveExport

    const messages = {
      clients: `You've reached your limit of ${limit} client${limit > 1 ? 's' : ''}. Upgrade to create more clients.`,
      products: `You've reached your limit of ${limit} product${limit > 1 ? 's' : ''}. Upgrade to create more products.`,
      invoice_exports: `You've reached your limit of ${limit} invoice export${limit > 1 ? 's' : ''}. Upgrade to export more invoices.`,
      email_shares: `You've reached your limit of ${limit} email share${limit > 1 ? 's' : ''}. Upgrade to share more invoices.`
    }

    return {
      show: !canCreateResource(resourceType),
      message: messages[resourceType] || `You've reached your usage limit. Upgrade to continue.`,
      currentCount,
      limit: limit === -1 ? 'Unlimited' : limit,
      planName: currentPlan.name
    }
  }, [canCreateResource, getRealTimeUsageCounts])

  // Track action when user performs it
  const trackAction = useCallback(async (actionType, resourceData = {}) => {
    try {
      // Only increment counters for actions that need manual tracking
      // Clients, products, and invoices are tracked by array length automatically
      if (actionType === 'invoice_exports' || actionType === 'email_shares') {
        subscriptionService.incrementUsageCount(actionType)
        console.log(`DEBUG: Incremented ${actionType} counter`)
      } else {
        console.log(`DEBUG: ${actionType} tracked automatically by array length`)
      }
      
      // Update local state with fresh counts
      const newCounts = getRealTimeUsageCounts()
      setUsageCounts(newCounts)

      // Track in service for analytics
      await subscriptionService.trackUsage(actionType, resourceData)
      
      return true
    } catch (error) {
      console.error('Error tracking action:', error)
      return false
    }
  }, [getRealTimeUsageCounts])

  // Get current plan information
  const getCurrentPlan = useCallback(() => {
    const user = userService.getCurrentUser()
    const plans = subscriptionService.getSubscriptionPlans()
    return plans[user?.subscription_tier] || plans.free
  }, [])

  // Get available export formats for current plan
  const getAvailableExportFormats = useCallback(() => {
    const plan = getCurrentPlan()
    return plan.limitations.exportFormats || ['pdf']
  }, [getCurrentPlan])

  // Get available templates for current plan
  const getAvailableTemplates = useCallback(() => {
    const plan = getCurrentPlan()
    return plan.limitations.templateAccess || ['default']
  }, [getCurrentPlan])

  // Check specific feature availability
  const canUseFeature = useCallback((feature) => {
    return subscriptionService.canUseFeature(feature)
  }, [])

  return {
    // State
    usageCounts,
    loading,
    
    // Checks
    canCreateResource,
    canExportFormat,
    canUseTemplate,
    canShareViaEmail,
    canUseFeature,
    
    // Actions
    trackAction,
    loadUsageCounts,
    showLimitModal,
    
    // Info
    getResourceLimits,
    getCurrentPlan,
    getAvailableExportFormats,
    getAvailableTemplates,
    
    // Utilities
    getRealTimeUsageCounts
  }
}

export default useSubscriptionLimits 