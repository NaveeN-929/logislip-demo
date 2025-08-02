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

  // Get real-time usage counts (cached and deduped)
  const getRealTimeUsageCounts = useCallback(async () => {
    try {
      // Use cached data by default - no logging spam
      const counts = await userService.getResourceUsageCounts(true)
      return counts
    } catch (error) {
      // Silent fallback - no console spam
      return {
        clients: 0,
        products: 0,
        invoices: 0,
        invoice_exports: 0,
        email_shares: 0
      }
    }
  }, [])

  // Load current usage counts with force refresh option
  const loadUsageCounts = useCallback(async (forceRefresh = false) => {
    // Skip if already loading, unless force refresh is requested
    if (loading && !forceRefresh) {
      return
    }
    
    // Skip if already has data and not forcing refresh
    if (!forceRefresh && Object.values(usageCounts).some(count => count > 0)) {
      return
    }
    
    setLoading(true)
    try {
      // Force fresh data if requested, otherwise use cache
      const counts = await userService.getResourceUsageCounts(!forceRefresh)
      setUsageCounts(counts)
    } catch (error) {
      // Silent error handling - reduce console noise
    } finally {
      setLoading(false)
    }
  }, [getRealTimeUsageCounts, loading, usageCounts])

  // Force refresh usage counts (for dashboard updates)
  const refreshUsageCounts = useCallback(async () => {
    // Clear cache to force fresh data
    userService.clearUsageCountsCache()
    
    setLoading(true)
    try {
      const counts = await userService.getResourceUsageCounts(false) // Force fresh data
      setUsageCounts(counts)
    } catch (error) {
      // Silent error handling
    } finally {
      setLoading(false)
    }
  }, [])

  // Load counts on mount (with deduplication)
  useEffect(() => {
    loadUsageCounts()
  }, []) // Removed dependency to prevent re-runs

  // Check if user can create a resource (efficient caching)
  const canCreateResource = useCallback(async (resourceType) => {
    try {
      // Always use cache first for instant response
      const cachedResult = await subscriptionService.canCreateResource(resourceType, null, true)
      return cachedResult
    } catch (error) {
      // Silent fallback - no logging spam, optimistic allow
      return true
    }
  }, [])

  // Check if user can export with specific format (efficient caching)
  const canExportFormat = useCallback(async (format) => {
    try {
      // Always use cache first - only refreshes when stale or after actual exports
      const canExport = await subscriptionService.canExportFormat(format, null, true)
      return canExport
    } catch (error) {
      // Silent fallback - no logging spam
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
      
      // Clear cache to get fresh data
      userService.clearUsageCountsCache()
      
      // Update local state with fresh counts immediately
      const newCounts = await userService.getResourceUsageCounts(false) // Force fresh
      setUsageCounts(newCounts)
      
      // Force a small delay to ensure state propagation
      await new Promise(resolve => setTimeout(resolve, 100))

      // Track in service for analytics
      await subscriptionService.trackUsage(actionType, resourceData)
      
      console.log(`✅ Tracked ${actionType}, updated counts:`, newCounts)
      
      // Dispatch event to notify other components (like dashboard)
      if (actionType === 'invoice_exports') {
        window.dispatchEvent(new CustomEvent('invoiceExportComplete', { 
          detail: { actionType, resourceData, newCounts } 
        }));
      }
      
      return true
    } catch (error) {
      console.error('Error tracking action:', error)
      return false
    }
  }, [])

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
    
    // Functions
    loadUsageCounts,
    refreshUsageCounts, // New: force refresh function
    trackAction,
    showLimitModal,
    
    // Checks
    canCreateResource,
    canExportFormat,
    canUseTemplate,
    canShareViaEmail,
    canUseFeature,
    
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