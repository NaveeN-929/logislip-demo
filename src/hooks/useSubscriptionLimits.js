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
  const getRealTimeUsageCounts = useCallback(async () => {
    try {
      // Use userService to get counts from Supabase
      const counts = await userService.getResourceUsageCounts()
      return counts
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
      const counts = await getRealTimeUsageCounts()
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
  const canCreateResource = useCallback(async (resourceType) => {
    const canCreate = await subscriptionService.canCreateResource(resourceType)
    return canCreate
  }, [])

  // Check if user can export with specific format (gets fresh count every time)
  const canExportFormat = useCallback(async (format) => {
    try {
      const canExport = await subscriptionService.canExportFormat(format)
      return canExport
    } catch (error) {
      console.error('Error checking export format permissions:', error)
      return false
    }
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
  const showLimitModal = useCallback(async (resourceType, onUpgrade) => {
    const user = userService.getCurrentUser()
    const plans = subscriptionService.getSubscriptionPlans()
    const currentPlan = plans[user?.subscription_tier] || plans.free
    const currentCounts = await getRealTimeUsageCounts()
    const currentCount = currentCounts[resourceType] || 0
    const limit = currentPlan.limitations[resourceType] || currentPlan.limitations.invoicesSaveExport

    const messages = {
      clients: `You've reached your limit of ${limit} client${limit > 1 ? 's' : ''}. Upgrade to create more clients.`,
      products: `You've reached your limit of ${limit} product${limit > 1 ? 's' : ''}. Upgrade to create more products.`,
      invoice_exports: `You've reached your limit of ${limit} invoice export${limit > 1 ? 's' : ''}. Upgrade to export more invoices.`,
      email_shares: `You've reached your limit of ${limit} email share${limit > 1 ? 's' : ''}. Upgrade to share more invoices.`
    }

    const canCreate = await canCreateResource(resourceType)

    return {
      show: !canCreate,
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
        await subscriptionService.incrementUsageCount(actionType)
      }
      
      // Update local state with fresh counts immediately
      const newCounts = await getRealTimeUsageCounts()
      setUsageCounts(newCounts)
      
      // Force a small delay to ensure state propagation
      await new Promise(resolve => setTimeout(resolve, 100))

      // Track in service for analytics
      await subscriptionService.trackUsage(actionType, resourceData)
      
      console.log(`✅ Tracked ${actionType}, updated counts:`, newCounts)
      
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