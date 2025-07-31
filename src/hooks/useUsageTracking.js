import { useState, useCallback, useEffect } from 'react'
import userService from '../services/userService'
import subscriptionService from '../services/subscriptionService'
import secureLogger from '../utils/secureLogger'

const useUsageTracking = () => {
  const [showUsageLimitModal, setShowUsageLimitModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [usage, setUsage] = useState({})
  const [user, setUser] = useState(null)

  // Check if user can perform an action
  const checkUsageLimit = useCallback(async (action = 'invoice_create') => {
    try {
      const result = await userService.checkUsageLimit(action)
      return result.canUse
    } catch (error) {
      secureLogger.error('Error checking usage limit:', error)
      return false
    }
  }, [])

  // Track usage for an action
  const trackUsage = useCallback(async (action = 'invoice_create', details = {}) => {
    try {
      setLoading(true)
      
      // Check if user can perform the action
      const canUse = await checkUsageLimit(action)
      if (!canUse) {
        throw new Error('Usage limit exceeded')
      }

      // Increment usage count
      const newCount = await userService.incrementUsage(action)
      
      // Update local state
      setUsage(prev => ({
        ...prev,
        [action]: newCount
      }))
      
      // Log the action with details
      await userService.logUserAction(action, details)
      
      return { success: true, count: newCount }
    } catch (error) {
      secureLogger.error('Error tracking usage:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [checkUsageLimit])

  // Get current usage statistics
  const getUsageStats = useCallback(() => {
    return subscriptionService.getUsageStats()
  }, [])

  // Check if user has premium features
  const hasPremiumFeatures = useCallback(() => {
    return userService.hasPremiumFeatures()
  }, [])

  // Get remaining usage
  const getRemainingUsage = useCallback(() => {
    return userService.getRemainingUsage()
  }, [])

  // Check if specific feature is available
  const canUseFeature = useCallback((feature) => {
    return subscriptionService.canUseFeature(feature)
  }, [])

  // Check if user has reached resource limit
  const hasReachedResourceLimit = useCallback((resourceType, currentCount = 0) => {
    return subscriptionService.hasReachedLimit(resourceType, currentCount)
  }, [])

  // Get resource limits for current plan
  const getResourceLimits = useCallback(() => {
    return subscriptionService.getResourceLimits()
  }, [])

  // Get auto-sync frequency
  const getAutoSyncFrequency = useCallback(() => {
    return subscriptionService.getAutoSyncFrequency()
  }, [])

  // Validate session and refresh if needed
  const validateSession = useCallback(async () => {
    try {
      const isValid = await userService.validateSession()
      if (!isValid.valid) {
        // Redirect to login
        window.location.href = '/login'
      }
      return true
    } catch (error) {
      secureLogger.error('Session validation error:', error)
      return false
    }
  }, [])

  // Load initial usage data
  useEffect(() => {
    const loadUsageData = async () => {
      try {
        // Load usage statistics
        const usageData = await userService.fetchUsageStats()
        setUsage(usageData)

        // Load user data
        const userData = await userService.getCurrentUser()
        setUser(userData)
      } catch (error) {
        secureLogger.error('Error loading usage data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUsageData()
  }, [])

  // Validate session periodically
  useEffect(() => {
    const validateSession = async () => {
      try {
        const isValid = await userService.validateSession()
        if (!isValid.valid) {
          // Session expired, redirect to login
          window.location.href = '/login'
        }
      } catch (error) {
        secureLogger.error('Session validation error:', error)
      }
    }

    // Check session every 5 minutes
    const interval = setInterval(validateSession, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return {
    // State
    showUsageLimitModal,
    loading,
    usage,
    user,
    
    // Actions
    checkUsageLimit,
    trackUsage,
    validateSession,
    
    // Getters
    getUsageStats,
    getRemainingUsage,
    hasPremiumFeatures,
    canUseFeature,
    hasReachedResourceLimit,
    getResourceLimits,
    getAutoSyncFrequency,
    
    // Modal controls
    setShowUsageLimitModal,
    reload: async () => {
      setLoading(true)
      try {
        const usageData = await userService.fetchUsageStats()
        setUsage(usageData)
      } catch (error) {
        secureLogger.error('Error reloading usage data:', error)
      } finally {
        setLoading(false)
      }
    }
  }
}

export default useUsageTracking 