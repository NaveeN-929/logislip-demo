import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../Button/Button';
import Modal from '../Common/Modal';
import { useCloudSync } from '../../hooks/useCloudSync';

const SyncStatusIcon = ({ status, className = "w-4 h-4" }) => {
  if (status.syncInProgress) {
    return (
      <motion.svg
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className={`${className} text-blue-500`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </motion.svg>
    );
  }

  if (!status.isOnline) {
    return (
      <svg className={`${className} text-red-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728" />
      </svg>
    );
  }

  if (!status.hasToken) {
    return (
      <svg className={`${className} text-yellow-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    );
  }

  if (status.isInitialized && status.hasToken) {
    return (
      <svg className={`${className} text-green-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }

  return (
    <svg className={`${className} text-gray-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
};

const SyncStatusBadge = ({ syncStatus, onClick, className = "" }) => {
  const getStatusText = () => {
    if (syncStatus.syncInProgress) return 'Syncing...';
    if (!syncStatus.isOnline) return 'Offline';
    if (!syncStatus.hasToken) return 'Not signed in';
    if (syncStatus.isInitialized) return 'Synced';
    return 'Not synced';
  };

  const getStatusColor = () => {
    if (syncStatus.syncInProgress) return 'bg-blue-100 text-blue-800';
    if (!syncStatus.isOnline) return 'bg-red-100 text-red-800';
    if (!syncStatus.hasToken) return 'bg-yellow-100 text-yellow-800';
    if (syncStatus.isInitialized) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${getStatusColor()} ${className}`}
    >
      <SyncStatusIcon status={syncStatus} className="w-3 h-3 mr-1" />
      {getStatusText()}
      {syncStatus.queuedOperations > 0 && (
        <span className="ml-1 bg-white bg-opacity-50 rounded-full px-1.5 py-0.5 text-xs">
          {syncStatus.queuedOperations}
        </span>
      )}
    </motion.button>
  );
};

const SyncStatusModal = ({ isOpen, onClose }) => {
  const { syncStatus, syncHistory, forceSync, exportBackup, importBackup, toggleAutoSync } = useCloudSync();
  const [importFile, setImportFile] = useState(null);

  const handleFileImport = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setImportFile(file);
      await importBackup(file);
      setImportFile(null);
      event.target.value = ''; // Reset file input
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Never';
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <SyncStatusIcon status={syncStatus} className="w-6 h-6 mr-2" />
            Cloud Sync Status
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Connection Status</div>
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${syncStatus.isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="font-medium">{syncStatus.isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Authentication</div>
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${syncStatus.hasToken ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="font-medium">{syncStatus.hasToken ? 'Signed in' : 'Not signed in'}</span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Last Sync</div>
            <div className="font-medium text-sm">
              {formatTimeAgo(syncStatus.lastSyncTime)}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Auto Sync</div>
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${syncStatus.autoSyncEnabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="font-medium">{syncStatus.autoSyncEnabled ? 'Enabled' : 'Disabled'}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Button 
            onClick={forceSync} 
            disabled={syncStatus.syncInProgress || !syncStatus.hasToken}
            className="w-full"
          >
            {syncStatus.syncInProgress ? 'Syncing...' : 'Force Sync'}
          </Button>

          <Button 
            onClick={() => toggleAutoSync(!syncStatus.autoSyncEnabled)}
            variant="outline"
            className="w-full"
          >
            {syncStatus.autoSyncEnabled ? 'Disable Auto Sync' : 'Enable Auto Sync'}
          </Button>

          <Button 
            onClick={exportBackup}
            variant="outline"
            className="w-full"
          >
            Export Backup
          </Button>

          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={importFile}
            />
            <Button 
              variant="outline"
              className="w-full"
              disabled={importFile}
            >
              {importFile ? 'Importing...' : 'Import Backup'}
            </Button>
          </div>
        </div>

        {/* Sync History */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Recent Activity</h3>
          
          {syncHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p>No sync activity yet</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              <AnimatePresence>
                {syncHistory.map((entry, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${entry.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {entry.action === 'upload_initial' && 'Initial upload'}
                          {entry.action === 'upload_local' && 'Uploaded changes'}
                          {entry.action === 'download_applied' && 'Downloaded changes'}
                          {entry.action === 'no_change' && 'No changes'}
                          {entry.action === 'error' && 'Sync error'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {entry.type} • {formatDate(entry.timestamp)}
                        </div>
                        {entry.error && (
                          <div className="text-xs text-red-600 mt-1">
                            {entry.error}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Device Info */}
        {syncStatus.deviceId && (
          <div className="border-t pt-4 mt-4">
            <div className="text-xs text-gray-500">
              Device ID: {syncStatus.deviceId}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export { SyncStatusBadge, SyncStatusModal, SyncStatusIcon };
export default SyncStatusModal;
