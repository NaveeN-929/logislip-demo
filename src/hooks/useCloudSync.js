import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import cloudSyncService from '../services/cloudSyncService';
import secureLogger from '../utils/secureLogger';

// Custom hook for cloud sync functionality
export const useCloudSync = () => {
  const [syncStatus, setSyncStatus] = useState({
    isInitialized: false,
    isOnline: navigator.onLine,
    hasToken: false,
    lastSyncTime: null,
    syncInProgress: false,
    queuedOperations: 0,
    autoSyncEnabled: true,
    deviceId: null,
    error: null,
  });

  const [syncHistory, setSyncHistory] = useState([]);
  const listenerRef = useRef(null);

  // Event listener for sync events
  const handleSyncEvent = useCallback((event, data = {}) => {
    // Removed debug log for security
    
    try {
      switch (event) {
        case 'sync_started':
          setSyncStatus(prev => ({ ...prev, syncInProgress: true }));
          break;
        case 'sync_completed':
          setSyncStatus(prev => ({ ...prev, syncInProgress: false, lastSyncTime: new Date() }));
          setSyncHistory(prev => [
            {
              timestamp: Date.now(),
              type: data.type || 'unknown',
              action: data.action || 'completed',
              success: data.success !== false, // Default to true if not specified
            },
            ...prev.slice(0, 9) // Keep last 10 entries
          ]);

          const actionMessages = {
            upload_initial: 'Initial data uploaded to cloud',
            upload_local: 'Local changes synced to cloud',
            download_applied: 'Cloud changes applied locally',
            no_change: 'Data is already in sync',
          };

          if (data.type === 'manual') {
            toast.success(`✅ ${actionMessages[data.action] || 'Sync completed'}`);
          }
          break;
        case 'sync_failed':
          setSyncStatus(prev => ({ ...prev, syncInProgress: false, error: data.error }));
          setSyncHistory(prev => [
            {
              timestamp: Date.now(),
              type: data.type || 'unknown',
              action: 'error',
              success: false,
              error: data.error || 'Unknown error',
            },
            ...prev.slice(0, 9)
          ]);

          if (data.type === 'manual') {
            toast.error(`❌ Sync failed: ${data.error || 'Unknown error'}`);
          }
          break;
        case 'initialized':
          setSyncStatus(prev => ({
            ...prev,
            isInitialized: data.success,
            error: data.success ? null : data.error?.message,
          }));
          
          if (data.success) {
            toast.success('☁️ Cloud sync initialized successfully');
          } else {
          toast.error(`❌ Failed to initialize cloud sync: ${data.error?.message}`);
        }
        break;
      case 'backup_imported':
        if (data.success) {
          toast.success('📁 Backup imported successfully - please refresh the page');
          // Refresh page after short delay to reflect imported data
          setTimeout(() => window.location.reload(), 2000);
        } else {
          toast.error(`❌ Failed to import backup: ${data.error}`);
        }
        break;
      default:
        // Removed debug log for security
        break;
    }

    // Update sync status safely
    try {
      const syncStatus = cloudSyncService.getSyncStatus();
      setSyncStatus(prev => ({
        ...prev,
        ...syncStatus,
      }));
    } catch (statusError) {
      console.error('Error getting sync status:', statusError);
    }
  } catch (error) {
    console.error('Error in handleSyncEvent:', error);
    // Prevent the error from propagating and breaking the sync
    setSyncStatus(prev => ({
      ...prev,
      error: 'Error handling sync event'
    }));
  }
}, []);

  // Initialize sync service
  const initializeSync = useCallback(async (accessToken, userId) => {
    try {
      await cloudSyncService.initialize(accessToken, userId);
      setSyncStatus(prev => ({ ...prev, isInitialized: true }));
      return true;
    } catch (error) {
      secureLogger.error('Failed to initialize sync:', error);
      setSyncStatus(prev => ({ ...prev, isInitialized: false, error: error.message }));
      return false;
    }
  }, []);

  // Manual sync trigger
  const forceSync = useCallback(async () => {
    try {
      setSyncStatus(prev => ({ ...prev, syncInProgress: true }));
      await cloudSyncService.forceSync();
      setSyncStatus(prev => ({ ...prev, syncInProgress: false, lastSyncTime: new Date() }));
      return true;
    } catch (error) {
      secureLogger.error('Force sync failed:', error);
      setSyncStatus(prev => ({ ...prev, syncInProgress: false, error: error.message }));
      return false;
    }
  }, []);

  // Export backup
  const exportBackup = useCallback(async () => {
    try {
      await cloudSyncService.exportBackup();
      toast.success('📁 Backup exported successfully');
      return true;
    } catch (error) {
      secureLogger.error('Export backup failed:', error);
      toast.error(`❌ Failed to export backup: ${error.message}`);
      return false;
    }
  }, []);

  // Import backup
  const importBackup = useCallback(async (file) => {
    try {
      const result = await cloudSyncService.importBackup(file);
      return result;
    } catch (error) {
      secureLogger.error('Import backup failed:', error);
              // Silent - import backup errors should not expose details
      return { success: false, error: error.message };
    }
  }, []);

  // Toggle auto sync
  const toggleAutoSync = useCallback((enabled) => {
    cloudSyncService.toggleAutoSync(enabled);
    setSyncStatus(prev => ({ ...prev, autoSyncEnabled: enabled }));
    
    if (enabled) {
      toast.success('✅ Auto sync enabled');
    } else {
      toast.info('⏸️ Auto sync disabled');
    }
  }, []);

  // Setup effect
  useEffect(() => {
    // Add event listeners
    listenerRef.current = handleSyncEvent;
    cloudSyncService.addEventListener('sync_started', handleSyncEvent);
    cloudSyncService.addEventListener('sync_completed', handleSyncEvent);
    cloudSyncService.addEventListener('sync_failed', handleSyncEvent);
    cloudSyncService.addEventListener('initialized', handleSyncEvent);
    cloudSyncService.addEventListener('backup_imported', handleSyncEvent);

    // Initial status update - safely
    try {
      const syncStatus = cloudSyncService.getSyncStatus();
      setSyncStatus(prev => ({
        ...prev,
        ...syncStatus,
      }));
    } catch (error) {
      console.error('Error getting initial sync status:', error);
    }

    // Cleanup
    return () => {
      if (listenerRef.current) {
        cloudSyncService.removeEventListener('sync_started', listenerRef.current);
        cloudSyncService.removeEventListener('sync_completed', listenerRef.current);
        cloudSyncService.removeEventListener('sync_failed', listenerRef.current);
        cloudSyncService.removeEventListener('initialized', listenerRef.current);
        cloudSyncService.removeEventListener('backup_imported', listenerRef.current);
      }
    };
  }, [handleSyncEvent]);

  // Update sync status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const syncStatus = cloudSyncService.getSyncStatus();
        setSyncStatus(prev => ({
          ...prev,
          ...syncStatus,
        }));
      } catch (error) {
        console.error('Error getting periodic sync status:', error);
      }
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    syncStatus,
    syncHistory,
    initializeSync,
    forceSync,
    exportBackup,
    importBackup,
    toggleAutoSync,
  };
};

export default useCloudSync;
