import userService from './userService'
import { supabase } from '../config/supabase'
import { loadRazorpayCheckout, openRazorpayCheckout } from '../utils/razorpay'

class SubscriptionService {
  constructor() {
    // UPI/Razorpay integration for Indian payments
    this.razorpay = null
  }

  // Subscription plans configuration with detailed limitations
  getSubscriptionPlans() {
    return {
      free: {
        id: 'free',
        name: 'Free',
        features: [
          '3 invoices save & export',
          '1 client',
          '1 product',
          'PDF export only',
          'Manual sync only',
          'Default template only',
          'No custom templates',
          'No priority support',
          'No Drive export',
          'No email sharing'
        ],
        // Detailed limitations
        limitations: {
          exportFormats: ['pdf'],
          autoSyncFrequency: 'manual', // manual only
          templateAccess: ['default'], // default only
          customTemplates: false,
          supportLevel: 'none',
          invoicesSaveExport: 3,
          clients: 1,
          products: 1, // Fixed: should be 1, not 5
          exportToDrive: false,
          emailShare: false
        },
        monthlyInvoiceLimit: 3,
        billing: {
          monthly: { 
            price: 0, 
            currency: 'INR', 
            interval: 'month',
            usageLimit: 3,
            razorpayPlanId: null,
            savings: 0 
          }
        },
        popular: false
      },
      pro: {
        id: 'pro',
        name: 'Pro',
        features: [
          '50 invoices save & export',
          '50 clients',
          '50 products',
          'PDF + Drive export',
          'Auto-sync every 30 minutes',
          'Default + Modern + Formal templates',
          'No custom templates',
          'Email support',
          'Drive export enabled',
          'Email sharing enabled'
        ],
        // Detailed limitations
        limitations: {
          exportFormats: ['pdf', 'drive'],
          autoSyncFrequency: '30min', // every 30 minutes
          templateAccess: ['default', 'modern', 'formal'],
          customTemplates: false,
          supportLevel: 'email',
          invoicesSaveExport: 50,
          clients: 50,
          products: 50,
          exportToDrive: true,
          emailShare: true
        },
        monthlyInvoiceLimit: 50,
        billing: {
          monthly: { 
            price: 499, 
            currency: 'INR', 
            interval: 'month',
            usageLimit: 50,
            razorpayPlanId: 'plan_pro_monthly_inr',
            savings: 0 
          },
          quarterly: { 
            price: 1347, 
            currency: 'INR', 
            interval: '3 months',
            usageLimit: 150,
            razorpayPlanId: 'plan_pro_quarterly_inr',
            savings: 10 // 10% savings
          },
          halfYearly: { 
            price: 2495, 
            currency: 'INR', 
            interval: '6 months',
            usageLimit: 300,
            razorpayPlanId: 'plan_pro_halfyearly_inr',
            savings: 17 // 17% savings
          },
          annual: { 
            price: 4790, 
            currency: 'INR', 
            interval: 'year',
            usageLimit: 600,
            razorpayPlanId: 'plan_pro_annual_inr',
            savings: 20 // 20% savings
          }
        },
        popular: true
      },
      business: {
        id: 'business',
        name: 'Business',
        features: [
          'Unlimited invoices save & export',
          'Unlimited clients',
          'Unlimited products',
          'All export formats',
          'Auto-sync every 5 minutes',
          'All templates available',
          'Custom templates enabled',
          'Priority support',
          'Drive export enabled',
          'Email sharing enabled'
        ],
        // Detailed limitations
        limitations: {
          exportFormats: ['pdf', 'drive', 'csv', 'xlsx', 'json'],
          autoSyncFrequency: '5min', // every 5 minutes
          templateAccess: ['default', 'modern', 'formal', 'custom'],
          customTemplates: true,
          supportLevel: 'priority',
          invoicesSaveExport: -1, // unlimited
          clients: -1, // unlimited
          products: -1, // unlimited
          exportToDrive: true,
          emailShare: true
        },
        monthlyInvoiceLimit: -1, // Unlimited
        billing: {
          monthly: { 
            price: 1999, 
            currency: 'INR', 
            interval: 'month',
            usageLimit: -1,
            razorpayPlanId: 'plan_business_monthly_inr',
            savings: 0 
          },
          quarterly: { 
            price: 5397, 
            currency: 'INR', 
            interval: '3 months',
            usageLimit: -1,
            razorpayPlanId: 'plan_business_quarterly_inr',
            savings: 10 // 10% savings
          },
          halfYearly: { 
            price: 9995, 
            currency: 'INR', 
            interval: '6 months',
            usageLimit: -1,
            razorpayPlanId: 'plan_business_halfyearly_inr',
            savings: 17 // 17% savings
          },
          annual: { 
            price: 19990, 
            currency: 'INR', 
            interval: 'year',
            usageLimit: -1,
            razorpayPlanId: 'plan_business_annual_inr',
            savings: 17 // 17% savings
          }
        },
        popular: false
      }
    }
  }

  // Create Razorpay payment session (Order via Supabase Function)
  async createPaymentSession(planId, billingCycle, billingInfo) {
    const plans = this.getSubscriptionPlans()
    const selectedPlan = plans[planId]
    
    if (!selectedPlan || !billingInfo.razorpayPlanId) {
      throw new Error('Invalid subscription plan or billing cycle')
    }

    const user = userService.getCurrentUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    try {
      // Create payment session in Supabase
      const paymentData = {
        user_id: user.id,
        plan_id: planId,
        billing_cycle: billingCycle,
        amount: billingInfo.price,
        currency: billingInfo.currency,
        status: 'pending',
        payment_method: 'upi',
        razorpay_plan_id: billingInfo.razorpayPlanId,
        created_at: new Date().toISOString()
      }

      const { data: payment, error } = await supabase
        .from('payments')
        .insert(paymentData)
        .select()
        .single()

      if (error) throw error

      // Create a Razorpay order using Supabase Edge Function
      let order = null
      try {
        const { data, error: fnError } = await supabase.functions.invoke('razorpay-order', {
          body: {
            amount: billingInfo.price * 100,
            currency: billingInfo.currency || 'INR',
            receipt: payment.id,
            notes: { plan_id: planId, billing_cycle: billingCycle }
          }
        })
        if (fnError) throw fnError
        order = data
      } catch (e) {
        console.error('Edge function error (razorpay-order):', e)
        throw new Error('Failed to initialize payment')
      }

      if (order && order.id) {
        // Persist order id
        await supabase
          .from('payments')
          .update({ razorpay_order_id: order.id })
          .eq('id', payment.id)

        return {
          success: true,
          paymentId: payment.id,
          plan: selectedPlan,
          billing: billingInfo,
          razorpayOrder: order
        }
      }
      throw new Error('Failed to create Razorpay order')
      
    } catch (error) {
      console.error('Payment session creation error:', error)
      throw new Error('Failed to create payment session')
    }
  }

  // Generate UPI payment details and QR code data
  generateUPIPaymentDetails(payment, plan, billingInfo) {
    const merchantId = process.env.REACT_APP_UPI_MERCHANT_ID || 'logislip@upi'
    const merchantName = process.env.REACT_APP_UPI_MERCHANT_NAME || 'LogiSlip'
    
    // UPI payment URL format
    const upiUrl = `upi://pay?pa=${merchantId}&pn=${merchantName}&am=${billingInfo.price}&cu=${billingInfo.currency}&tn=LogiSlip ${plan.name} Plan - Payment ID: ${payment.id}`
    
    return {
      upiUrl,
      qrCodeData: upiUrl,
      amount: billingInfo.price,
      currency: billingInfo.currency,
      merchantId,
      merchantName,
      transactionNote: `LogiSlip ${plan.name} Plan - Payment ID: ${payment.id}`,
      paymentId: payment.id
    }
  }

  // Confirm payment via RPC function (Postgres)
  async confirmPayment(paymentId, transactionId) {
    try {
      const { data, error } = await supabase.rpc('activate_subscription', {
        p_payment_id: paymentId,
        p_transaction_id: transactionId
      })
      if (error) throw error

      const plans = this.getSubscriptionPlans()
      const selectedPlan = plans[data?.plan_id || 'free']

      // Refresh the local user snapshot so UI reflects new plan without re-login
      try {
        const current = userService.getCurrentUser()
        if (current?.id) {
          const { data: freshUser, error: userErr } = await supabase
            .from('users')
            .select('*')
            .eq('id', current.id)
            .single()
          if (!userErr && freshUser) {
            // Persist fresh user locally
            userService.currentUser = freshUser
            localStorage.setItem('logislip_user', JSON.stringify(freshUser))
            // Update resource usage limits for the new tier
            await userService.updateResourceUsageLimits(freshUser.subscription_tier)
            // Invalidate usage cache so UI picks up new limits immediately
            userService.clearUsageCountsCache()
          }
        }
      } catch (e) {
        // Non-fatal; UI can still reflect after hard refresh
        console.warn('Post-payment local user refresh failed:', e)
      }

      return {
        success: true,
        subscriptionId: data?.subscription_id || `sub_${Date.now()}`,
        plan: selectedPlan,
        payment: data?.payment || null
      }
    } catch (error) {
      console.error('Payment confirmation error:', error)
      throw new Error('Failed to confirm payment')
    }
  }

  // Launch Razorpay Checkout for a prepared order
  async payWithRazorpay({ paymentId, razorpayOrder, plan, billing }) {
    const user = userService.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    await loadRazorpayCheckout()

    return new Promise((resolve, reject) => {
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'LogiSlip',
        description: `${plan.name} • ${billing.interval}`,
        order_id: razorpayOrder.id,
        prefill: {
          name: user.name,
          email: user.email
        },
        notes: { payment_id: paymentId, plan_id: plan.id },
        handler: async (response) => {
          try {
            // Verify signature server-side
            const { data: verifyResult, error: verifyError } = await supabase.functions.invoke('razorpay-verify', {
              body: {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                payment_id: paymentId
              }
            })

            if (!verifyError && verifyResult?.verified) {
              // Store razorpay_payment_id
              await supabase
                .from('payments')
                .update({
                  razorpay_payment_id: response.razorpay_payment_id
                })
                .eq('id', paymentId)

              // Activate subscription
              const result = await this.confirmPayment(paymentId, response.razorpay_payment_id)
              resolve(result)
            } else {
              reject(new Error('Payment verification failed'))
            }
          } catch (err) {
            reject(err)
          }
        },
        modal: {
          ondismiss: () => reject(new Error('Payment cancelled'))
        },
        theme: { color: '#2563EB' }
      }

      try {
        openRazorpayCheckout(options)
      } catch (err) {
        reject(err)
      }
    })
  }

  // Calculate subscription end date
  calculateEndDate(interval) {
    const now = new Date()
    if (interval === 'month') {
      now.setMonth(now.getMonth() + 1)
    } else if (interval === '3 months') {
      now.setMonth(now.getMonth() + 3)
    } else if (interval === '6 months') {
      now.setMonth(now.getMonth() + 6)
    } else if (interval === 'year') {
      now.setFullYear(now.getFullYear() + 1)
    }
    return now.toISOString()
  }

  // Cancel subscription
  async cancelSubscription() {
    const user = userService.getCurrentUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    try {
      const subscriptionData = {
        tier: 'free',
        status: 'cancelled',
        endDate: null,
        usageLimit: 36
      }
      
      await userService.updateSubscription(subscriptionData)
      
      return { success: true }
    } catch (error) {
      // Silent - subscription errors should not expose details
      throw error
    }
  }

  // Get current subscription status
  getCurrentSubscription() {
    const user = userService.getCurrentUser()
    if (!user) return null

    const plans = this.getSubscriptionPlans()
    const currentPlan = plans[user.subscription_tier]
    
    return {
      plan: currentPlan,
      status: user.subscription_status,
      endDate: user.subscription_end_date,
      usageCount: user.usage_count,
      usageLimit: user.usage_limit,
      remainingUsage: userService.getRemainingUsage()
    }
  }

  // Track usage for specific actions
  async trackUsage(actionType, resourceData = {}) {
    const user = userService.getCurrentUser()
    if (!user) return false

    try {
      // Log the usage action
      await userService.logUserAction(actionType, {
        resource_type: actionType,
        resource_id: resourceData.id || null,
        timestamp: Date.now(),
        user_tier: user.subscription_tier,
        ...resourceData
      })

      return true
    } catch (error) {
      console.error('Error tracking usage:', error)
      return false
    }
  }

  // Get usage counts for different resource types
  async getResourceUsageCounts() {
    const user = userService.getCurrentUser()
    if (!user) return {}

    try {
      // Use userService to get resource usage counts from Supabase
      const counts = await userService.getResourceUsageCounts()
      return counts
    } catch (error) {
      console.error('Error getting usage counts:', error)
      return {
        clients: 0,
        products: 0,
        invoices: 0,
        invoice_exports: 0,
        email_shares: 0
      }
    }
  }

  // Increment usage counter for specific action
  async incrementUsageCount(actionType) {
    try {
      // Use userService to increment resource usage in Supabase
      const result = await userService.incrementResourceUsage(actionType)
      
      // Track the action for analytics
      await this.trackUsage(actionType, { 
        count: result?.current_count || 0,
        limit: result?.limit_count || 0
      })
      
      return result?.current_count || 0
    } catch (error) {
      console.error('Error incrementing usage count:', error)
      return 0
    }
  }

  // Check if subscription is active
  isSubscriptionActive() {
    const user = userService.getCurrentUser()
    if (!user) return false

    if (user.subscription_tier === 'free') return true
    
    if (user.subscription_status !== 'active') return false
    
    if (user.subscription_end_date) {
      return new Date(user.subscription_end_date) > new Date()
    }
    
    return true
  }

  // Get usage statistics
  getUsageStats() {
    const user = userService.getCurrentUser()
    if (!user) return null

    const usagePercentage = user.usage_limit > 0 
      ? (user.usage_count / user.usage_limit) * 100 
      : 0

    return {
      current: user.usage_count,
      limit: user.usage_limit,
      remaining: userService.getRemainingUsage(),
      percentage: Math.min(usagePercentage, 100),
      isUnlimited: user.usage_limit === -1
    }
  }

  // Check if user can use specific feature based on their plan
  canUseFeature(feature) {
    const user = userService.getCurrentUser()
    if (!user) return false

    const plans = this.getSubscriptionPlans()
    const currentPlan = plans[user.subscription_tier] || plans.free
    const limitations = currentPlan.limitations

    switch (feature) {
      case 'export_pdf':
        return limitations.exportFormats.includes('pdf')
      
      case 'export_drive':
        return limitations.exportToDrive && limitations.exportFormats.includes('drive')
      
      case 'export_csv':
        return limitations.exportFormats.includes('csv')
      
      case 'export_xlsx':
        return limitations.exportFormats.includes('xlsx')
      
      case 'export_json':
        return limitations.exportFormats.includes('json')
      
      case 'email_share':
        return limitations.emailShare
      
      case 'auto_sync_30min':
        return limitations.autoSyncFrequency === '30min' || limitations.autoSyncFrequency === '5min'
      
      case 'auto_sync_5min':
        return limitations.autoSyncFrequency === '5min'
      
      case 'template_modern':
        return limitations.templateAccess.includes('modern')
      
      case 'template_formal':
        return limitations.templateAccess.includes('formal')
      
      case 'custom_templates':
        return limitations.customTemplates
      
      case 'priority_support':
        return limitations.supportLevel === 'priority'
      
      case 'email_support':
        return limitations.supportLevel === 'email' || limitations.supportLevel === 'priority'
      
      default:
        return true
    }
  }

  // Check if user has reached limit for a specific resource - OPTIMIZED WITH CACHING
  async hasReachedLimit(resourceType, currentCount = null, useCache = true) {
    const user = userService.getCurrentUser()
    if (!user) return true

    const plans = this.getSubscriptionPlans()
    const currentPlan = plans[user.subscription_tier] || plans.free
    const limitations = currentPlan.limitations

    // Get count (with optional caching) if not provided
    if (currentCount === null) {
      try {
        // Use cached counts for faster response
        const usageCounts = await userService.getResourceUsageCounts(useCache)
        currentCount = usageCounts[resourceType] || 0
      } catch (error) {
        console.error('Error getting resource usage count:', error)
        // Fallback: assume 0 usage (optimistic)
        currentCount = 0
      }
    }

    let hasReached = false;
    switch (resourceType) {
      case 'invoices':
      case 'invoice_exports':
        hasReached = limitations.invoicesSaveExport !== -1 && currentCount >= limitations.invoicesSaveExport
        break
      
      case 'clients':
        hasReached = limitations.clients !== -1 && currentCount >= limitations.clients
        break
      
      case 'products':
        hasReached = limitations.products !== -1 && currentCount >= limitations.products
        break
      
      case 'email_shares':
        // Free users cannot share via email at all
        if (!limitations.emailShare) hasReached = true
        // Pro users have a limit of 50, Business users unlimited
        else hasReached = limitations.invoicesSaveExport !== -1 && currentCount >= limitations.invoicesSaveExport
        break
      
      default:
        hasReached = false
    }

    // Debug removed to reduce console noise

    return hasReached
  }

  // Check if user can create a new resource (before creation) - OPTIMIZED
  async canCreateResource(resourceType, currentCount = null, useCache = true) {
    const user = userService.getCurrentUser()
    if (!user) {
      return false
    }

    try {
      // Use the updated hasReachedLimit method with caching
      const limitReached = await this.hasReachedLimit(resourceType, currentCount, useCache)
      const canCreate = !limitReached
      
      return canCreate
    } catch (error) {
      console.error('Error checking resource creation limit:', error)
      // Optimistic fallback: allow creation if check fails
      return true
    }
  }

  // Check if user can export with specific format - OPTIMIZED
  async canExportFormat(format, currentExportCount = null, useCache = true) {
    const user = userService.getCurrentUser()
    if (!user) return false

    const plans = this.getSubscriptionPlans()
    const currentPlan = plans[user.subscription_tier] || plans.free
    const limitations = currentPlan.limitations

    // Check if format is allowed
    const formatAllowed = limitations.exportFormats.includes(format.toLowerCase())
    if (!formatAllowed) {
      return false
    }

    // Get export count (with optional caching) if not provided
    if (currentExportCount === null) {
      try {
        const usageCounts = await userService.getResourceUsageCounts(useCache)
        currentExportCount = usageCounts.invoice_exports || 0
      } catch (error) {
        console.error('Error getting export usage count:', error)
        // Fallback: assume 0 exports (optimistic)
        currentExportCount = 0
      }
    }

    // Check export count limits
    const limitReached = await this.hasReachedLimit('invoice_exports', currentExportCount, useCache)
    
    if (format.toLowerCase() === 'drive') {
      const canExport = limitations.exportToDrive && !limitReached
      return canExport
    }

    const canExport = !limitReached
    return canExport
  }

  // Check if user can use specific template
  canUseTemplate(templateName) {
    const user = userService.getCurrentUser()
    if (!user) return false

    const plans = this.getSubscriptionPlans()
    const currentPlan = plans[user.subscription_tier] || plans.free
    const limitations = currentPlan.limitations

    // Default template is always available
    if (templateName === 'default') return true

    // Check if template is in allowed list
    return limitations.templateAccess.includes(templateName.toLowerCase())
  }

  // Check if user can share via email
  async canShareViaEmail(currentEmailShares = null) {
    const user = userService.getCurrentUser()
    if (!user) return false

    const plans = this.getSubscriptionPlans()
    const currentPlan = plans[user.subscription_tier] || plans.free
    const limitations = currentPlan.limitations

    // Free users cannot share via email
    if (!limitations.emailShare) {
      return false
    }

    // Get real-time email share count if not provided
    if (currentEmailShares === null) {
      const usageCounts = await userService.getResourceUsageCounts()
      currentEmailShares = usageCounts.email_shares || 0
    }

    // Check count limits for Pro users
    const limitReached = await this.hasReachedLimit('email_shares', currentEmailShares)
    const canShare = !limitReached
    return canShare
  }

  // Get resource limits for current plan
  getResourceLimits() {
    const user = userService.getCurrentUser()
    if (!user) return null

    const plans = this.getSubscriptionPlans()
    const currentPlan = plans[user.subscription_tier] || plans.free

    return currentPlan.limitations
  }

  // Get auto-sync frequency in minutes (0 = manual only)
  getAutoSyncFrequency() {
    const user = userService.getCurrentUser()
    if (!user) return 0

    const plans = this.getSubscriptionPlans()
    const currentPlan = plans[user.subscription_tier] || plans.free
    
    switch (currentPlan.limitations.autoSyncFrequency) {
      case '5min':
        return 5
      case '30min':
        return 30
      case 'manual':
      default:
        return 0 // Manual only
    }
  }

  // Handle webhook events for UPI/Razorpay (for production use)
  async handleWebhookEvent(event) {
    switch (event.type) {
      case 'payment.captured':
        await this.handlePaymentCaptured(event.data.object)
        break
      case 'payment.failed':
        await this.handlePaymentFailed(event.data.object)
        break
      case 'subscription.cancelled':
        await this.handleSubscriptionCancelled(event.data.object)
        break
      default:
        console.log('Unhandled webhook event:', event.type)
    }
  }

  async handlePaymentCaptured(payment) {
    try {
      // Find payment in Supabase
      const { data: paymentRecord, error } = await supabase
        .from('payments')
        .select('*')
        .eq('razorpay_payment_id', payment.id)
        .single()

      if (error || !paymentRecord) {
        console.error('Payment record not found:', payment.id)
        return
      }

      // Confirm the payment
      await this.confirmPayment(paymentRecord.id, payment.id)
    } catch (error) {
      console.error('Error handling payment captured:', error)
    }
  }

  async handlePaymentFailed(payment) {
    try {
      // Update payment status to failed
      await supabase
        .from('payments')
        .update({ 
          status: 'failed',
          failure_reason: payment.error_description 
        })
        .eq('razorpay_payment_id', payment.id)
    } catch (error) {
      console.error('Error handling payment failed:', error)
    }
  }

  async handleSubscriptionCancelled(subscription) {
    try {
      // Find user by subscription ID and update to free tier
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('razorpay_subscription_id', subscription.id)
        .single()

      if (error || !user) return

      await userService.updateSubscription({
        tier: 'free',
        status: 'cancelled',
        endDate: null,
        usageLimit: 3
      })
    } catch (error) {
      console.error('Error handling subscription cancelled:', error)
    }
  }
}

// Create singleton instance
const subscriptionService = new SubscriptionService()
export default subscriptionService 