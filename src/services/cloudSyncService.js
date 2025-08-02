import localforage from 'localforage';
import {
  uploadToGoogleDrive,
  findOrCreateGoogleDriveFolder
} from '../utils/googleDrive';
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
import subscriptionService from './subscriptionService';
import userService from './userService';

// Cloud sync configuration
const SYNC_CONFIG = {
  APP_FOLDER_NAME: 'LogiSlip_Data',
  BACKUP_FILE_NAME: 'logislip_backup.json',
  METADATA_FILE_NAME: 'sync_metadata.json',
  AUTO_SYNC_INTERVAL: 5 * 60 * 1000, // 5 minutes
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000,
  VERSION_HISTORY_LIMIT: 10,
};

// Data keys that need to be synced
const SYNC_KEYS = [
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
];

class CloudSyncService {
  constructor() {
    this.accessToken = null;
    this.userId = null;
    this.appFolderId = null;
    this.isOnline = navigator.onLine;
    this.syncQueue = [];
    this.lastSyncTime = null;
    this.syncInProgress = false;
    this.autoSyncInterval = null;
    this.eventListeners = new Set();
    this.dataSyncTimeout = null;

    // Initialize sync metadata in localStorage
    this.initializeSyncMetadata();
    
    // Try to restore previous authentication state
    this.restoreAuthState();
    
    // Setup online/offline detection
    this.setupNetworkListeners();
    
    // Setup periodic sync
    this.setupAutoSync();

    // Hook into LocalForage to trigger sync on data changes
    this.installDataChangeHooks();
    
    // CloudSyncService initialized
  }

  // Restore authentication state from localStorage
  async restoreAuthState() {
    try {
      const authState = localStorage.getItem('cloudSyncAuth');
      if (authState) {
        const { accessToken, userId } = JSON.parse(authState);
        
        if (accessToken && userId) {
          await this.initialize(accessToken, userId);
          return true;
        }
      }
    } catch (error) {
      secureLogger.error('Failed to restore authentication state:', error);
    }
    return false;
  }

  // Store authentication state in localStorage
  async storeAuthState(accessToken, userId) {
    try {
      const authState = {
        accessToken,
        userId,
        timestamp: Date.now()
      };
      localStorage.setItem('cloudSyncAuth', JSON.stringify(authState));
    } catch (error) {
      secureLogger.error('Failed to persist authentication state:', error);
    }
  }

  // Initialize the service
  async initialize(accessToken, userId) {
    try {
      // Removed debug logs for security
      
      // Validate access token format
      if (!accessToken || !accessToken.startsWith('ya29.')) {
        secureLogger.warn('Access token does not appear to be a valid Google token');
      }
      
      this.accessToken = accessToken;
      this.userId = userId;

      // Create or find app folder
      await this.setupAppFolder();

      // Persist authentication state
      await this.storeAuthState(accessToken, userId);

      // Perform initial sync
      await this.performSync('initialize');

      // Notify listeners
      this.notifyListeners('initialized', { success: true });

      return true;
    } catch (error) {
      secureLogger.error('Failed to initialize Cloud Sync Service:', error);
      this.clearAuthenticationState();
      this.notifyListeners('initialized', { success: false, error });
      throw error;
    }
  }

  // Setup app folder in Google Drive
  async setupAppFolder() {
    try {
      const metadata = this.getSyncMetadata();
      const deviceId = metadata.deviceId || this.generateDeviceId();
      
      // Use simpler folder name without device ID to avoid duplicates
      // Each user will have one main folder, and we'll use file versioning for conflict resolution
      const userFolderName = `${SYNC_CONFIG.APP_FOLDER_NAME}_${this.userId}`;
      
      const folder = await findOrCreateGoogleDriveFolder({
        accessToken: this.accessToken,
        folderName: userFolderName
      });
      
      this.appFolderId = folder.id;
    } catch (error) {
      secureLogger.error('Failed to setup app folder:', error);
      throw error;
    }
  }

  // Get all local data for sync
  async getAllLocalData() {
    const data = {};
    const metadata = this.getSyncMetadata();

    for (const key of SYNC_KEYS) {
      try {
        const value = await localforage.getItem(key);
        // Convert null to undefined to avoid DataCloneError
        data[key] = value === null ? undefined : value;
      } catch (error) {
        secureLogger.warn(`Failed to read ${key}:`, error);
        data[key] = undefined;
      }
    }

    // Add metadata
    data._metadata = {
      timestamp: Date.now(),
      deviceId: metadata.deviceId,
      version: metadata.syncVersion,
      hash: this.generateDataHash(data),
    };

    return data;
  }

  // Generate hash for data integrity
  generateDataHash(data) {
    const jsonString = JSON.stringify(data, Object.keys(data).sort());
    let hash = 0;
    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  // Upload data to Google Drive
  async uploadToCloud(data, syncType = 'manual') {
    try {
      const backupData = {
        ...data,
        _syncInfo: {
          syncType,
          timestamp: Date.now(),
          deviceId: this.getSyncMetadata().deviceId,
        }
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json'
      });

      // Use consistent file name to avoid duplicates
      const fileName = SYNC_CONFIG.BACKUP_FILE_NAME;
      
      // Check if file already exists and update it instead of creating new
      let existingFileId = null;
      try {
        const searchQuery = `name='${fileName}' and '${this.appFolderId}' in parents and trashed=false`;
        const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(searchQuery)}&fields=files(id,name)`;
        
        const searchResponse = await fetch(searchUrl, {
          headers: { Authorization: `Bearer ${this.accessToken}` }
        });

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          if (searchData.files.length > 0) {
            existingFileId = searchData.files[0].id;
          }
        }
      } catch (error) {
        secureLogger.warn('Could not search for existing file:', error);
      }

      let result;
      if (existingFileId) {
        // Update existing file
        const updateUrl = `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`;
        const updateResponse = await fetch(updateUrl, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: blob,
        });

        if (!updateResponse.ok) {
          throw new Error('Failed to update existing file: ' + (await updateResponse.text()));
        }
        
        result = { id: existingFileId };
      } else {
        // Create new file
        result = await uploadToGoogleDrive({
          accessToken: this.accessToken,
          file: blob,
          fileName,
          folderId: this.appFolderId
        });
      }

      // Update sync metadata
      this.updateSyncMetadata({
        lastSyncTime: Date.now(),
        lastSyncHash: data._metadata.hash,
        lastUploadFileId: result.id,
      });

      return result;
    } catch (error) {
      secureLogger.error('Failed to upload data:', error);
      throw error;
    }
  }

  // Download data from Google Drive
  async downloadFromCloud() {
    try {
      // Search for backup file
      const query = `name='${SYNC_CONFIG.BACKUP_FILE_NAME}' and '${this.appFolderId}' in parents and trashed=false`;
      const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc`;
      
      const searchResponse = await fetch(searchUrl, {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });

      if (!searchResponse.ok) {
        throw new Error('Failed to search for backup file');
      }

      const searchData = await searchResponse.json();
      
      if (searchData.files.length === 0) {
        return null;
      }

      const backupFile = searchData.files[0];
      
      // Download file content
      const downloadUrl = `https://www.googleapis.com/drive/v3/files/${backupFile.id}?alt=media`;
      const downloadResponse = await fetch(downloadUrl, {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });

      if (!downloadResponse.ok) {
        throw new Error('Failed to download backup file');
      }

      const backupData = await downloadResponse.json();
      
      return {
        data: backupData,
        fileId: backupFile.id,
        modifiedTime: backupFile.modifiedTime,
      };
    } catch (error) {
      secureLogger.error('Failed to download data:', error);
      throw error;
    }
  }

  // Apply cloud data to local storage
  async applyCloudDataToLocal(cloudData, conflictResolution = 'latest_wins') {
    const metadata = this.getSyncMetadata();
    
    secureLogger.info('Applying cloud data to local storage');

    // Simple conflict resolution: latest wins
    if (conflictResolution === 'latest_wins') {
      const cloudTimestamp = cloudData._metadata?.timestamp || 0;
      const localTimestamp = metadata.lastSyncTime || 0;

      if (cloudTimestamp <= localTimestamp) {
        secureLogger.info('Local data is newer or equal, skipping sync');
        return { applied: false, reason: 'local_newer' };
      }
    }

    // Apply cloud data to local storage
    const applied = [];
    const failed = [];

    // Get current user and subscription limits
    const user = userService.getCurrentUser();
    const plans = subscriptionService.getSubscriptionPlans();
    const currentPlan = plans[user?.subscription_tier] || plans.free;

    for (const key of SYNC_KEYS) {
      try {
        if (cloudData[key] !== undefined) {
          let dataToApply = cloudData[key];
          
          // Apply subscription limits to data being synced from cloud
          if (user && Array.isArray(dataToApply)) {
            if (key === CLIENTS_KEY) {
              const clientLimit = currentPlan.limitations.clients;
              if (clientLimit !== -1 && dataToApply.length > clientLimit) {
                console.log(`CLOUD SYNC LIMIT ENFORCEMENT: Truncating ${dataToApply.length} clients to ${clientLimit} for ${currentPlan.name} plan`);
                dataToApply = dataToApply.slice(0, clientLimit);
              }
            } else if (key === PRODUCTS_KEY) {
              const productLimit = currentPlan.limitations.products;
              if (productLimit !== -1 && dataToApply.length > productLimit) {
                console.log(`CLOUD SYNC LIMIT ENFORCEMENT: Truncating ${dataToApply.length} products to ${productLimit} for ${currentPlan.name} plan`);
                dataToApply = dataToApply.slice(0, productLimit);
              }
            } else if (key === INVOICES_KEY || key === INVOICE_DETAILS) {
              const invoiceLimit = currentPlan.limitations.invoicesSaveExport;
              if (invoiceLimit !== -1 && dataToApply.length > invoiceLimit) {
                console.log(`CLOUD SYNC LIMIT ENFORCEMENT: Truncating ${dataToApply.length} ${key === INVOICES_KEY ? 'invoices' : 'invoice details'} to ${invoiceLimit} for ${currentPlan.name} plan`);
                dataToApply = dataToApply.slice(0, invoiceLimit);
              }
            }
          }
          
          await localforage.setItem(key, dataToApply);
          applied.push(key);
          secureLogger.info(`Applied ${key} from cloud`);
        }
      } catch (error) {
        secureLogger.error(`Failed to apply ${key}:`, error);
        failed.push({ key, error: error.message });
      }
    }

    // Update metadata
    this.updateSyncMetadata({
      lastSyncTime: Date.now(),
      lastSyncHash: cloudData._metadata?.hash,
    });

    secureLogger.info(`Sync completed: ${applied.length} applied, ${failed.length} failed`);
    
    return {
      applied: true,
      appliedKeys: applied,
      failedKeys: failed,
      timestamp: Date.now(),
    };
  }

  // Perform full sync operation
  async performSync(syncType = 'manual') {
    if (this.syncInProgress) {
      secureLogger.info('Sync already in progress, skipping');
      return { success: false, reason: 'sync_in_progress' };
    }

    if (!this.isOnline) {
      secureLogger.info('Offline, queuing sync operation');
      this.queueSyncOperation(syncType);
      return { success: false, reason: 'offline' };
    }

    if (!this.accessToken) {
      secureLogger.info('No access token available');
      return { success: false, reason: 'no_token' };
    }

    this.syncInProgress = true;
    this.notifyListeners('sync_started', { type: syncType });
    
    try {
      secureLogger.info(`Starting ${syncType} sync`);
      
      // Get local data
      const localData = await this.getAllLocalData();
      
      // Download cloud data
      const cloudResult = await this.downloadFromCloud();
      
      if (!cloudResult) {
        // No cloud data exists, upload local data
        secureLogger.info('No cloud data found, uploading local data');
        await this.uploadToCloud(localData, syncType);
        
        this.notifyListeners('sync_completed', { 
          type: syncType, 
          action: 'upload_initial',
          success: true 
        });
        
        return { success: true, action: 'upload_initial' };
      }

      // Compare and resolve conflicts
      const localHash = localData._metadata.hash;
      const cloudHash = cloudResult.data._metadata?.hash;
      
      if (localHash === cloudHash) {
        secureLogger.info('Data is in sync, no action needed');
        
        this.notifyListeners('sync_completed', { 
          type: syncType, 
          action: 'no_change',
          success: true 
        });
        
        return { success: true, action: 'no_change' };
      }

      // Determine sync direction
      const metadata = this.getSyncMetadata();
      const cloudTimestamp = cloudResult.data._metadata?.timestamp || 0;
      const localTimestamp = metadata.lastSyncTime || 0;

      if (cloudTimestamp > localTimestamp) {
        // Cloud is newer, download and apply
        secureLogger.info('Cloud data is newer, applying to local');
        const result = await this.applyCloudDataToLocal(cloudResult.data);
        
        this.notifyListeners('sync_completed', { 
          type: syncType, 
          action: 'download_applied',
          success: true,
          result 
        });
        
        return { success: true, action: 'download_applied', result };
      } else {
        // Local is newer, upload
        secureLogger.info('Local data is newer, uploading to cloud');
        await this.uploadToCloud(localData, syncType);
        
        this.notifyListeners('sync_completed', { 
          type: syncType, 
          action: 'upload_local',
          success: true 
        });
        
        return { success: true, action: 'upload_local' };
      }

    } catch (error) {
      secureLogger.error('Sync failed:', error);
      
      this.notifyListeners('sync_failed', { 
        type: syncType, 
        error: error.message,
        timestamp: Date.now()
      });
      
      if (syncType === 'auto') {
        // For auto sync, queue for retry
        this.queueSyncOperation('retry');
      }
      
      return { success: false, error: error.message };
    } finally {
      this.syncInProgress = false;
    }
  }

  // Queue sync operation for when online
  queueSyncOperation(syncType) {
    this.syncQueue.push({
      type: syncType,
      timestamp: Date.now(),
    });
  }

  // Process queued sync operations
  async processQueuedSyncOperations() {
    if (this.syncQueue.length === 0) return;

    secureLogger.info(`Processing ${this.syncQueue.length} queued sync operations`);
    
    // Get latest queued operation
    const latestOperation = this.syncQueue.pop();
    this.syncQueue = []; // Clear queue
    
    try {
      await this.performSync(latestOperation.type);
    } catch (error) {
      secureLogger.error('Failed to process sync queue:', error);
    }
  }

  // Force sync (manual trigger)
  async forceSync() {
    secureLogger.info('Force sync triggered');
    return await this.performSync('manual');
  }

  // Event listener management
  addEventListener(callback) {
    this.eventListeners.add(callback);
  }

  removeEventListener(callback) {
    this.eventListeners.delete(callback);
  }

  notifyListeners(event, data = {}) {
    this.eventListeners.forEach(callback => {
      try {
        if (typeof callback === 'function') {
          callback(event, data);
        }
      } catch (error) {
        secureLogger.error('Error in sync event listener:', {
          error: error.message || 'Unknown error',
          event,
          stack: error.stack
        });
      }
    });
  }

  // Export data for manual backup
  async exportBackup() {
    try {
      const data = await this.getAllLocalData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logislip_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      secureLogger.info('Backup exported successfully');
      return true;
    } catch (error) {
      secureLogger.error('Failed to export backup:', error);
      throw error;
    }
  }

  // Import data from backup file
  async importBackup(file) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Validate backup data
      if (!data._metadata) {
        throw new Error('Invalid backup file format');
      }

      // Apply backup data
      const result = await this.applyCloudDataToLocal(data, 'force');
      
      secureLogger.info('Backup imported successfully');
      
      this.notifyListeners('backup_imported', { 
        success: true, 
        result 
      });
      
      return result;
    } catch (error) {
      secureLogger.error('Failed to import backup:', error);
      
      this.notifyListeners('backup_imported', { 
        success: false, 
        error: error.message 
      });
      
      throw error;
    }
  }

  // Check if service is initialized
  isInitialized() {
    return !!(this.accessToken && this.userId);
  }

  // Get sync status
  getSyncStatus() {
    const metadata = this.getSyncMetadata();
    return {
      isInitialized: this.isInitialized(),
      isOnline: this.isOnline,
      hasToken: !!this.accessToken,
      lastSyncTime: metadata?.lastSyncTime,
      syncInProgress: this.syncInProgress,
      queuedOperations: this.syncQueue.length,
      autoSyncEnabled: metadata?.autoSyncEnabled,
      deviceId: metadata?.deviceId,
    };
  }

  // Toggle auto sync
  toggleAutoSync(enabled) {
    this.updateSyncMetadata({ autoSyncEnabled: enabled });
    
    if (enabled) {
      this.setupAutoSync();
      secureLogger.info('Auto sync enabled');
    } else {
      if (this.autoSyncInterval) {
        clearInterval(this.autoSyncInterval);
        this.autoSyncInterval = null;
      }
      secureLogger.info('Auto sync disabled');
    }
  }

  // Logout and clear authentication state
  logout() {
    // Clear authentication state
    this.clearAuthenticationState();
    
    // Stop auto sync
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = null;
    }
    
    // Clear sync queue
    this.syncQueue = [];
    
    // Reset sync status
    this.syncInProgress = false;
    
    // Notify listeners
    this.notifyListeners('logged_out', { success: true });
    
    secureLogger.info('Logged out from cloud sync');
  }

  // Cleanup
  destroy() {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
    }
    
    if (this.dataSyncTimeout) {
      clearTimeout(this.dataSyncTimeout);
    }
    
    window.removeEventListener('online', this.processQueuedSyncOperations);
    window.removeEventListener('offline', () => {});
    
    this.eventListeners.clear();
    secureLogger.info('Cloud Sync Service destroyed');
  }

  // Hook into LocalForage to trigger sync on data changes
  installDataChangeHooks() {
    // Store original LocalForage methods
    const originalSetItem = localforage.setItem.bind(localforage);
    const originalRemoveItem = localforage.removeItem.bind(localforage);
    const originalClear = localforage.clear.bind(localforage);
    
    // Override setItem to trigger sync
    localforage.setItem = async (key, value) => {
      // Handle null/undefined values that cause DataCloneError
      let sanitizedValue = value;
      
      // Convert null to undefined, handle arrays and objects
      if (value === null) {
        sanitizedValue = undefined;
      } else if (Array.isArray(value)) {
        // Clean null values from arrays
        sanitizedValue = value.map(item => item === null ? undefined : item);
      } else if (value && typeof value === 'object') {
        // Clean null values from objects
        sanitizedValue = JSON.parse(JSON.stringify(value, (k, v) => v === null ? undefined : v));
      }
      
      try {
        const result = await originalSetItem(key, sanitizedValue);
        
        // Trigger sync if this is a tracked key
        if (SYNC_KEYS.includes(key) && this.isInitialized()) {
          secureLogger.info(`Data change detected in ${key}, queueing sync operation`);
          this.queueSyncOperation('data_change');
          
          // Debounce sync to avoid too many calls
          if (this.dataSyncTimeout) {
            clearTimeout(this.dataSyncTimeout);
          }
          
          this.dataSyncTimeout = setTimeout(async () => {
            if (this.isOnline && this.getSyncMetadata().autoSyncEnabled) {
              secureLogger.info(`Auto-sync triggered by data change in ${key}`);
              try {
                await this.performSync('data_change');
              } catch (error) {
                secureLogger.warn('Auto-sync failed:', error);
              }
            } else {
              secureLogger.info(`Auto-sync skipped - online: ${this.isOnline}, autoSyncEnabled: ${this.getSyncMetadata().autoSyncEnabled}`);
            }
          }, 500); // Reduced to 500ms for faster response
        } else {
          secureLogger.info(`Sync not triggered - key: ${key}, tracked: ${SYNC_KEYS.includes(key)}, initialized: ${this.isInitialized()}, hasToken: ${!!this.accessToken}, userId: ${this.userId}`);
        }
        
        return result;
      } catch (error) {
        secureLogger.error(`Failed to store ${key}:`, error);
        throw error;
      }
    };
    
    // Override removeItem to trigger sync
    localforage.removeItem = async (key) => {
      try {
        const result = await originalRemoveItem(key);
        
        // Trigger sync if this is a tracked key
        if (SYNC_KEYS.includes(key) && this.isInitialized()) {
          secureLogger.info(`Data removal detected in ${key}, queueing sync operation`);
          this.queueSyncOperation('data_change');
          
          if (this.dataSyncTimeout) {
            clearTimeout(this.dataSyncTimeout);
          }
          
          this.dataSyncTimeout = setTimeout(async () => {
            if (this.isOnline && this.getSyncMetadata().autoSyncEnabled) {
              secureLogger.info(`Auto-sync triggered by data removal in ${key}`);
              try {
                await this.performSync('data_change');
              } catch (error) {
                secureLogger.warn('Auto-sync failed:', error);
              }
            } else {
              secureLogger.info(`Auto-sync skipped - online: ${this.isOnline}, autoSyncEnabled: ${this.getSyncMetadata().autoSyncEnabled}`);
            }
          }, 500); // Reduced to 500ms for faster response
        } else {
          secureLogger.info(`Sync not triggered - key: ${key}, tracked: ${SYNC_KEYS.includes(key)}, initialized: ${this.isInitialized()}`);
        }
        
        return result;
      } catch (error) {
        secureLogger.error(`Failed to remove ${key}:`, error);
        throw error;
      }
    };
    
    // Override clear to trigger sync
    localforage.clear = async () => {
      try {
        const result = await originalClear();
        
        if (this.isInitialized()) {
          this.queueSyncOperation('data_change');
          
          if (this.dataSyncTimeout) {
            clearTimeout(this.dataSyncTimeout);
          }
          
          this.dataSyncTimeout = setTimeout(async () => {
            if (this.isOnline && this.getSyncMetadata().autoSyncEnabled) {
              secureLogger.info('Auto-sync triggered by data clear');
              try {
                await this.performSync('data_change');
              } catch (error) {
                secureLogger.warn('Auto-sync failed:', error);
              }
            }
          }, 2000);
        }
        
        return result;
      } catch (error) {
        secureLogger.error('Failed to clear storage:', error);
        throw error;
      }
    };
    
    secureLogger.info('Data change hooks installed');
  }

  // Initialize sync metadata in localStorage
  initializeSyncMetadata() {
    const existingMetadata = localStorage.getItem('cloudSyncMetadata');
    if (!existingMetadata) {
      const metadata = {
        deviceId: this.generateDeviceId(),
        autoSyncEnabled: true,
        lastSyncTime: null,
        syncVersion: 1,
        initialized: true
      };
      localStorage.setItem('cloudSyncMetadata', JSON.stringify(metadata));
    }
  }

  // Get sync metadata from localStorage
  getSyncMetadata() {
    try {
      const metadata = localStorage.getItem('cloudSyncMetadata');
      if (metadata) {
        return JSON.parse(metadata);
      }
    } catch (error) {
      secureLogger.error('Failed to get sync metadata:', error);
    }
    
    // Return default metadata if none exists
    return {
      deviceId: this.generateDeviceId(),
      autoSyncEnabled: true,
      lastSyncTime: null,
      syncVersion: 1,
      initialized: true
    };
  }

  // Update sync metadata in localStorage
  updateSyncMetadata(updates) {
    try {
      const currentMetadata = this.getSyncMetadata();
      const newMetadata = { ...currentMetadata, ...updates };
      localStorage.setItem('cloudSyncMetadata', JSON.stringify(newMetadata));
    } catch (error) {
      secureLogger.error('Failed to update sync metadata:', error);
    }
  }

  // Generate unique device ID
  generateDeviceId() {
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Setup network listeners for online/offline detection
  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      secureLogger.info('Network connection restored');
      this.processQueuedSyncOperations();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      secureLogger.info('Network connection lost');
    });
  }

  // Setup automatic sync interval based on subscription plan
  setupAutoSync() {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
    }

    // Get auto-sync frequency from subscription plan
    const getAutoSyncFrequency = () => {
      try {
        // Dynamic import to avoid circular dependency
        return import('../services/subscriptionService').then(module => {
          const subscriptionService = module.default;
          return subscriptionService.getAutoSyncFrequency();
        });
      } catch (error) {
        secureLogger.warn('Could not get auto-sync frequency, defaulting to manual:', error);
        return Promise.resolve(0); // Manual only
      }
    };

    // Setup auto-sync based on plan limitations
    getAutoSyncFrequency().then(frequencyMinutes => {
      if (frequencyMinutes > 0) {
        secureLogger.info(`Setting up auto-sync every ${frequencyMinutes} minutes`);
        this.autoSyncInterval = setInterval(async () => {
          if (this.isOnline && this.getSyncMetadata().autoSyncEnabled && this.isInitialized()) {
            try {
              await this.performSync('auto');
            } catch (error) {
              secureLogger.warn('Auto-sync failed:', error);
            }
          }
        }, frequencyMinutes * 60 * 1000);
      } else {
        secureLogger.info('Auto-sync disabled by subscription plan (manual only)');
      }
    }).catch(error => {
      secureLogger.warn('Failed to setup auto-sync:', error);
    });
  }

  // Clear authentication state
  clearAuthenticationState() {
    this.accessToken = null;
    this.userId = null;
    this.appFolderId = null;
    
    try {
      localStorage.removeItem('cloudSyncAuth');
    } catch (error) {
      secureLogger.error('Failed to clear authentication state:', error);
    }
  }
}

// Export singleton instance
export const cloudSyncService = new CloudSyncService();
export default cloudSyncService;
