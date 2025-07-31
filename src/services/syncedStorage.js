import localforage from 'localforage';
import cloudSyncService from '../services/cloudSyncService';
import { sanitizeDataForStorage } from '../utils/storage';
import {
  COMPANY_KEY,
  CLIENTS_KEY,
  PRODUCTS_KEY,
  INVOICES_KEY,
  INVOICE_DETAILS,
  CLIENT_FORM_KEY,
  PRODUCT_FORM_KEY,
  INVOICE_FORM_KEY,
  DEFAULT_INVOICE_COLOR,
  DEFAULT_INVOICE_BG,
} from '../constants/localKeys';
import secureLogger from '../utils/secureLogger';

// Enhanced storage utility with automatic cloud sync
class SyncedStorageService {
  constructor() {
    this.syncDebounceTimeout = null;
    this.syncQueue = new Set();
    this.isInitialized = false;
  }

  // Initialize the synced storage service
  initialize() {
    this.isInitialized = true;
    // SyncedStorageService initialized
  }

  // Enhanced setItem with automatic sync
  async setItem(key, value, skipSync = false) {
    try {
      const sanitizedValue = sanitizeDataForStorage(value);
      const result = await localforage.setItem(key, sanitizedValue);
      
      if (!skipSync && cloudSyncService) {
        await cloudSyncService.triggerSync(key, 'update');
      }
      
      return result;
    } catch (error) {
      secureLogger.error(`Failed to store ${key}:`, error);
      throw error;
    }
  }

  // Enhanced getItem
  async getItem(key) {
    try {
      return await localforage.getItem(key);
    } catch (error) {
      secureLogger.error(`Failed to retrieve ${key}:`, error);
      throw error;
    }
  }

  // Enhanced removeItem with sync
  async removeItem(key, skipSync = false) {
    try {
      const result = await localforage.removeItem(key);
      
      if (!skipSync && cloudSyncService) {
        await cloudSyncService.triggerSync(key, 'delete');
      }
      
      return result;
    } catch (error) {
      secureLogger.error(`Failed to remove ${key}:`, error);
      throw error;
    }
  }

  // Queue sync operation with debouncing
  queueSync(changedKey) {
    if (!this.isInitialized) return;
    
    this.syncQueue.add(changedKey);
    
    // Debounce sync operations
    if (this.syncDebounceTimeout) {
      clearTimeout(this.syncDebounceTimeout);
    }
    
    this.syncDebounceTimeout = setTimeout(() => {
      this.performDebouncedSync();
    }, 2000); // Wait 2 seconds after last change
  }

  // Perform debounced sync
  async performDebouncedSync() {
    if (this.syncQueue.size === 0) return;
    
    const changedKeys = Array.from(this.syncQueue);
    this.syncQueue.clear();
    
    try {
      const syncStatus = cloudSyncService.getSyncStatus();
      if (syncStatus.hasToken && syncStatus.isOnline) {
        await cloudSyncService.performSync('auto_data_change');
      }
    } catch (error) {
      secureLogger.warn('Auto-sync failed:', error);
    }
  }

  // Clear debounce timeout
  clearSync() {
    if (this.syncDebounceTimeout) {
      clearTimeout(this.syncDebounceTimeout);
      this.syncDebounceTimeout = null;
    }
    this.syncQueue.clear();
  }

  // Get sync queue status
  getSyncQueueStatus() {
    return {
      queuedKeys: Array.from(this.syncQueue),
      hasPendingSync: this.syncDebounceTimeout !== null,
    };
  }

  // Auto-sync function
  async performAutoSync() {
    try {
      if (cloudSyncService && cloudSyncService.isEnabled()) {
        await cloudSyncService.sync();
      }
    } catch (error) {
      secureLogger.warn('Auto-sync failed:', error);
    }
  }
}

// Create singleton instance
export const syncedStorage = new SyncedStorageService();

// Enhanced storage utilities that automatically trigger sync
export const saveDataWithSync = async (key, data) => {
  return await syncedStorage.setItem(key, data);
};

export const getDataWithSync = async (key) => {
  return await syncedStorage.getItem(key);
};

export const removeDataWithSync = async (key) => {
  return await syncedStorage.removeItem(key);
};

// Specific data type helpers
export const saveClientData = async (clients) => {
  return await saveDataWithSync(CLIENTS_KEY, clients);
};

export const saveProductData = async (products) => {
  return await saveDataWithSync(PRODUCTS_KEY, products);
};

export const saveInvoiceData = async (invoices) => {
  return await saveDataWithSync(INVOICES_KEY, invoices);
};

export const saveInvoiceDetailData = async (invoiceDetails) => {
  return await saveDataWithSync(INVOICE_DETAILS, invoiceDetails);
};

export const saveCompanyData = async (company) => {
  return await saveDataWithSync(COMPANY_KEY, company);
};

// Initialize the service
syncedStorage.initialize();

export default syncedStorage;
