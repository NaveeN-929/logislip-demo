import React, { useState, useEffect } from 'react'
import userService from '../../services/userService'
import subscriptionService from '../../services/subscriptionService'
import SubscriptionPlans from '../Subscription/SubscriptionPlans'
import CancelSubscriptionConfirm from '../Subscription/CancelSubscriptionConfirm'
import { SyncStatusIcon } from '../Common/SyncStatus'
import { useCloudSync } from '../../hooks/useCloudSync'
import secureLogger from '../../utils/secureLogger'

const UserProfile = ({ isOpen, onClose }) => {
  const [user, setUser] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [usageStats, setUsageStats] = useState(null)
  const [showSubscriptionPlans, setShowSubscriptionPlans] = useState(false)
  const [loading, setLoading] = useState(true)
  const [regeneratingAvatar, setRegeneratingAvatar] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const { syncStatus, syncHistory, forceSync, exportBackup, importBackup, toggleAutoSync } = useCloudSync()


  const handleFileImport = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setImportFile(file);
      await importBackup(file);
      setImportFile(null);
      event.target.value = ''; // Reset file input
    }
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  }

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
  }

  useEffect(() => {
    if (isOpen) {
      loadUserData()
    }
  }, [isOpen])

  const loadUserData = async () => {
    setLoading(true)
    try {
      const currentUser = userService.getCurrentUser()
      const userAnalytics = await userService.getUserAnalytics()
      const userUsageStats = await subscriptionService.getUsageStats()
      setUser(currentUser)
      setAnalytics(userAnalytics)
      setUsageStats(userUsageStats)
    } catch (error) {
      secureLogger.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await userService.logout()
      window.location.reload() // Refresh to show login screen
    } catch (error) {
      secureLogger.error('Logout error:', error)
    }
  }

  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const handleCancelSubscription = () => setShowCancelConfirm(true)
  const confirmCancel = async () => {
    try {
      await subscriptionService.cancelSubscription()
      await loadUserData() // Refresh user data
      setSuccessMsg('Subscription cancelled successfully')
    } catch (error) {
      secureLogger.error('Cancel subscription error:', error)
    } finally {
      setShowCancelConfirm(false)
    }
  }

  const handleRegenerateAvatar = async () => {
    if (regeneratingAvatar) return
    
    setRegeneratingAvatar(true)
    try {
      const updatedUser = await userService.regenerateUserAvatar()
      setUser(updatedUser)
    } catch (error) {
      secureLogger.error('Error regenerating avatar:', error)
    } finally {
      setRegeneratingAvatar(false)
    }
  }

  const subscription = subscriptionService.getCurrentSubscription()

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {successMsg && (
              <div className="mb-4 rounded-md bg-green-50 p-3 border border-green-200 text-sm text-green-800">
                {successMsg}
              </div>
            )}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">User Profile</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* User Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <img
                        src={user?.avatar_url || 'https://via.placeholder.com/64'}
                        alt={user?.name}
                        className="w-16 h-16 rounded-full"
                      />
                      {regeneratingAvatar && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{user?.name}</h3>
                      <p className="text-gray-600">{user?.email}</p>
                      <p className="text-sm text-gray-500">
                        Member since {new Date(user?.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleRegenerateAvatar}
                    disabled={regeneratingAvatar}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                    title="Generate new random avatar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>{regeneratingAvatar ? 'Generating...' : 'New Avatar'}</span>
                  </button>
                </div>

                {/* Subscription Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-gray-900">Subscription</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      subscription?.plan?.id === 'free' 
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {subscription?.plan?.name || 'Free'}
                    </span>
                  </div>
                  
                  {subscription?.plan?.id !== 'free' && subscription?.endDate && (
                    <p className="text-sm text-gray-600 mb-2">
                      Renews on {new Date(subscription.endDate).toLocaleDateString()}
                    </p>
                  )}

                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowSubscriptionPlans(true)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      {subscription?.plan?.id === 'free' ? 'Upgrade Plan' : 'Change Plan'}
                    </button>
                    
                    {subscription?.plan?.id !== 'free' && (
                      <button
                        onClick={handleCancelSubscription}
                        className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200"
                      >
                        Cancel Subscription
                      </button>
                    )}
                  </div>
                </div>

                {/* Cloud Sync Status */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900 flex items-center">
                      <SyncStatusIcon status={syncStatus} className="w-5 h-5 mr-2" />
                      Cloud Sync
                    </h4>
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      syncStatus.syncInProgress ? 'bg-blue-100 text-blue-800' :
                      !syncStatus.isOnline ? 'bg-red-100 text-red-800' :
                      !syncStatus.hasToken ? 'bg-yellow-100 text-yellow-800' :
                      syncStatus.isInitialized ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {syncStatus.syncInProgress ? 'Syncing...' :
                       !syncStatus.isOnline ? 'Offline' :
                       !syncStatus.hasToken ? 'Not signed in' :
                       syncStatus.isInitialized ? 'Synced' : 'Not synced'}
                    </div>
                  </div>

                  {/* Status Overview Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1">Connection</div>
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${syncStatus.isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm font-medium">{syncStatus.isOnline ? 'Online' : 'Offline'}</span>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1">Authentication</div>
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${syncStatus.hasToken ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm font-medium">{syncStatus.hasToken ? 'Signed in' : 'Not signed in'}</span>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1">Last Sync</div>
                      <div className="text-sm font-medium">
                        {formatTimeAgo(syncStatus.lastSyncTime)}
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1">Auto Sync</div>
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${syncStatus.autoSyncEnabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <span className="text-sm font-medium">{syncStatus.autoSyncEnabled ? 'Enabled' : 'Disabled'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <button
                      onClick={forceSync}
                      disabled={syncStatus.syncInProgress || !syncStatus.hasToken}
                      className="bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {syncStatus.syncInProgress ? 'Syncing...' : 'Force Sync'}
                    </button>

                    <button
                      onClick={() => toggleAutoSync(!syncStatus.autoSyncEnabled)}
                      className="bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm font-medium hover:bg-gray-300 transition-colors"
                    >
                      {syncStatus.autoSyncEnabled ? 'Disable Auto' : 'Enable Auto'}
                    </button>

                    <button
                      onClick={exportBackup}
                      className="bg-green-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                      Export Backup
                    </button>

                    <div className="relative">
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleFileImport}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={importFile}
                      />
                      <button
                        className="w-full bg-orange-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        disabled={importFile}
                      >
                        {importFile ? 'Importing...' : 'Import Backup'}
                      </button>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="border-t pt-4">
                    <h5 className="text-sm font-medium text-gray-900 mb-3">Recent Activity</h5>
                    
                    {syncHistory.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p className="text-xs">No sync activity yet</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {syncHistory.slice(0, 3).map((entry, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-white rounded"
                          >
                            <div className="flex items-center">
                              <div className={`w-2 h-2 rounded-full mr-2 ${entry.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                              <div>
                                <div className="text-xs font-medium text-gray-900">
                                  {entry.action === 'upload_initial' && 'Initial upload'}
                                  {entry.action === 'upload_local' && 'Uploaded changes'}
                                  {entry.action === 'download_applied' && 'Downloaded changes'}
                                  {entry.action === 'no_change' && 'No changes'}
                                  {entry.action === 'error' && 'Sync error'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formatDate(entry.timestamp)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Device Info */}
                  {syncStatus.deviceId && (
                    <div className="border-t pt-3 mt-3">
                      <div className="text-xs text-gray-500">
                        Device ID: {syncStatus.deviceId}
                      </div>
                    </div>
                  )}
                </div>

                {/* Usage Statistics */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Usage Statistics</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600">Monthly Usage</span>
                        <span className="text-sm font-medium">
                          {usageStats?.current} / {usageStats?.isUnlimited ? '∞' : usageStats?.limit}
                        </span>
                      </div>
                      {!usageStats?.isUnlimited && (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              usageStats?.percentage > 80 ? 'bg-red-500' : 
                              usageStats?.percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${usageStats?.percentage}%` }}
                          ></div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Total Actions</span>
                        <p className="font-semibold">{analytics?.totalActions || 0}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Last Activity</span>
                        <p className="font-semibold">
                          {analytics?.lastActivity 
                            ? new Date(analytics.lastActivity).toLocaleDateString()
                            : 'Never'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                {analytics?.recentActions?.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Recent Activity</h4>
                    <div className="space-y-2">
                      {analytics.recentActions.slice(0, 5).map((action, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600 capitalize">
                            {action.action.replace('_', ' ')}
                          </span>
                          <span className="text-gray-500">
                            {new Date(action.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={handleLogout}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showSubscriptionPlans && (
        <SubscriptionPlans 
          onClose={() => {
            setShowSubscriptionPlans(false)
            loadUserData() // Refresh data after subscription change
          }} 
        />
      )}

      <CancelSubscriptionConfirm
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={confirmCancel}
      />
    </>
  )
}

export default UserProfile 