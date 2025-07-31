import subscriptionService from '../services/subscriptionService';
import userService from '../services/userService';

/**
 * Validates and enforces subscription limits on data arrays
 * This utility helps ensure users don't exceed their subscription limits
 * when data is loaded from storage or synced from cloud
 */
class SubscriptionLimitValidator {
  
  /**
   * Validates and truncates data arrays based on subscription limits
   * @param {string} resourceType - Type of resource ('clients', 'products', 'invoices')
   * @param {Array} data - Array of data to validate
   * @returns {Array} - Truncated array if limits are exceeded
   */
  static validateResourceLimit(resourceType, data) {
    if (!Array.isArray(data)) {
      return data;
    }

    const user = userService.getCurrentUser();
    if (!user) {
      return data;
    }

    const plans = subscriptionService.getSubscriptionPlans();
    const currentPlan = plans[user.subscription_tier] || plans.free;

    let limit;
    switch (resourceType) {
      case 'clients':
        limit = currentPlan.limitations.clients;
        break;
      case 'products':
        limit = currentPlan.limitations.products;
        break;
      case 'invoices':
        limit = currentPlan.limitations.invoicesSaveExport;
        break;
      default:
        return data;
    }

    // If limit is -1, it's unlimited
    if (limit === -1) {
      return data;
    }

    // If data exceeds limit, truncate and log
    if (data.length > limit) {
      console.log(`SUBSCRIPTION LIMIT ENFORCEMENT: Truncating ${data.length} ${resourceType} to ${limit} for ${currentPlan.name} plan`);
      return data.slice(0, limit);
    }

    return data;
  }

  /**
   * Validates multiple resources at once
   * @param {Object} resources - Object containing resource arrays
   * @returns {Object} - Object with validated/truncated arrays
   */
  static validateMultipleResources(resources) {
    const validated = {};

    if (resources.clients) {
      validated.clients = this.validateResourceLimit('clients', resources.clients);
    }

    if (resources.products) {
      validated.products = this.validateResourceLimit('products', resources.products);
    }

    if (resources.invoices) {
      validated.invoices = this.validateResourceLimit('invoices', resources.invoices);
    }

    if (resources.invoiceDetails) {
      validated.invoiceDetails = this.validateResourceLimit('invoices', resources.invoiceDetails);
    }

    return validated;
  }

  /**
   * Checks if a user can create a new resource
   * @param {string} resourceType - Type of resource
   * @param {number} currentCount - Current count of resources
   * @returns {boolean} - Whether user can create the resource
   */
  static canCreateResource(resourceType, currentCount) {
    return subscriptionService.canCreateResource(resourceType, currentCount);
  }

  /**
   * Gets the current usage and limits for a resource type
   * @param {string} resourceType - Type of resource
   * @param {number} currentCount - Current count of resources
   * @returns {Object} - Usage info with current count, limit, and remaining
   */
  static getResourceUsageInfo(resourceType, currentCount) {
    const user = userService.getCurrentUser();
    if (!user) {
      return { currentCount: 0, limit: 0, remaining: 0, planName: 'Unknown' };
    }

    const plans = subscriptionService.getSubscriptionPlans();
    const currentPlan = plans[user.subscription_tier] || plans.free;

    let limit;
    switch (resourceType) {
      case 'clients':
        limit = currentPlan.limitations.clients;
        break;
      case 'products':
        limit = currentPlan.limitations.products;
        break;
      case 'invoices':
        limit = currentPlan.limitations.invoicesSaveExport;
        break;
      default:
        limit = 0;
    }

    return {
      currentCount,
      limit: limit === -1 ? 'Unlimited' : limit,
      remaining: limit === -1 ? 'Unlimited' : Math.max(0, limit - currentCount),
      planName: currentPlan.name,
      canCreate: limit === -1 || currentCount < limit
    };
  }
}

export default SubscriptionLimitValidator;
