import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import userService from '../../services/userService'
import subscriptionService from '../../services/subscriptionService'
import { SyncStatusIcon } from '../../components/Common/SyncStatus'
import { useCloudSync } from '../../hooks/useCloudSync'
import secureLogger from '../../utils/secureLogger'
import PhoneVerificationModal from '../../components/Auth/PhoneVerificationModal'
import otpService from '../../services/otpService'

const ProfileScreen = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [regeneratingAvatar, setRegeneratingAvatar] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [showPhoneModal, setShowPhoneModal] = useState(false)
  const { syncStatus, syncHistory, forceSync, exportBackup, importBackup, toggleAutoSync } = useCloudSync()
  
  // Safety check for syncStatus
  const safeSyncStatus = syncStatus || {
    isInitialized: false,
    isOnline: navigator.onLine,
    hasToken: false,
    lastSyncTime: null,
    syncInProgress: false,
    queuedOperations: 0,
    autoSyncEnabled: true,
    deviceId: null,
    error: null,
  }

  useEffect(() => {
    loadUserData()
  }, [])

  const handleFileImport = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setImportFile(file);
      await importBackup(file);
      setImportFile(null);
      event.target.value = ''; // Reset file input
    }
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

  const loadUserData = async () => {
    setLoading(true)
    try {
      const currentUser = userService.getCurrentUser()
      const userAnalytics = await userService.getUserAnalytics()
      setUser(currentUser)
      setAnalytics(userAnalytics)
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

  const handleCancelSubscription = async () => {
    if (window.confirm('Are you sure you want to cancel your subscription?')) {
      try {
        await subscriptionService.cancelSubscription()
        await loadUserData() // Refresh user data
        alert('Subscription cancelled successfully')
      } catch (error) {
        secureLogger.error('Cancel subscription error:', error)
      }
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

  const openChangePhone = () => {
    setShowPhoneModal(true)
  }

  const subscription = subscriptionService.getCurrentSubscription()

  if (loading) {
    return (
      <div className="p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse">
              <div className="flex items-center space-x-4 mb-6">
                <div className="h-16 w-16 bg-gray-300 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-32"></div>
                  <div className="h-3 bg-gray-300 rounded w-48"></div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-300 rounded w-full"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* User Info Card */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              {/* Left side - User Profile */}
              <div className="flex items-center space-x-4">
                <img
                  src={user?.avatar_url || 'https://via.placeholder.com/64'}
                  alt={user?.name || 'User'}
                  className="w-16 h-16 rounded-full border-4 border-white shadow-lg"
                />
                <div className="text-white">
                  <h1 className="text-2xl font-bold">{user?.name || 'User'}</h1>
                  <p className="text-blue-100">{user?.email}</p>
                  <p className="text-sm text-blue-200">
                    Member since {new Date(user?.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Right side - Subscription & Avatar Actions */}
              <div className="flex flex-col lg:items-end space-y-4">
                {/* Subscription Info */}
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 w-full lg:min-w-[280px]">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-white">Subscription</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      subscription?.plan?.id === 'free' 
                        ? 'bg-white/20 text-white'
                        : 'bg-white/20 text-white'
                    }`}>
                      {subscription?.plan?.name || 'Free'}
                    </span>
                  </div>
                  
                  {subscription?.plan?.id !== 'free' && subscription?.endDate && (
                    <p className="text-sm text-blue-100 mb-3">
                      Renews on {new Date(subscription.endDate).toLocaleDateString()}
                    </p>
                  )}

                  <div className="space-y-2">
                    <button
                      onClick={() => navigate('/subscription')}
                      className="w-full bg-white text-blue-600 py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
                    >
                      {subscription?.plan?.id === 'free' ? 'Upgrade Plan' : 'Manage Subscription'}
                    </button>
                    
                    {subscription?.plan?.id !== 'free' && (
                      <button
                        onClick={handleCancelSubscription}
                        className="w-full bg-red-500/20 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors"
                      >
                        Cancel Subscription
                      </button>
                    )}
                  </div>
                </div>

                {/* Avatar Actions */}
                <button
                  onClick={handleRegenerateAvatar}
                  disabled={regeneratingAvatar}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
                  title="Generate new random avatar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>{regeneratingAvatar ? 'Generating...' : 'New Avatar'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Cloud Sync Card */}
        <div className="bg-white rounded-lg shadow">
          {/* Phone Section */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Mobile number</div>
                <div className="flex items-center gap-3">
                  <div className="text-gray-900 font-medium">
                    {user?.phone_number ? (
                      <span>
                        {user.phone_number}
                        {user.phone_verified ? (
                          <span className="ml-2 inline-flex items-center text-green-600 text-xs">
                            <svg className="w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414l2.293 2.293 6.543-6.543a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                            Verified
                          </span>
                        ) : (
                          <span className="ml-2 inline-flex items-center text-yellow-600 text-xs">
                            <svg className="w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.721-1.36 3.486 0l6.516 11.59c.75 1.335-.213 2.986-1.742 2.986H3.483c-1.53 0-2.492-1.651-1.743-2.986L8.257 3.1zM11 13a1 1 0 10-2 0 1 1 0 002 0zm-1-2a1 1 0 01-1-1V7a1 1 0 112 0v3a1 1 0 01-1 1z" clipRule="evenodd"/></svg>
                            Not verified
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-gray-500">No phone number added</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center md:justify-end">
                <button
                  onClick={openChangePhone}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                >{user?.phone_number ? 'Change number' : 'Add number'}</button>
              </div>
            </div>
          </div>
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Cloud Sync</h2>
              <SyncStatusIcon 
                status={safeSyncStatus}
              />
            </div>
          </div>

          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Sync Status</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-medium ${safeSyncStatus.isInitialized ? 'text-green-600' : 'text-gray-500'}`}>
                      {safeSyncStatus.isInitialized ? 'Active' : 'Not Connected'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Auto Sync:</span>
                    <span className={`font-medium ${safeSyncStatus.autoSyncEnabled ? 'text-green-600' : 'text-gray-500'}`}>
                      {safeSyncStatus.autoSyncEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Sync:</span>
                    <span className="font-medium">{formatTimeAgo(safeSyncStatus.lastSyncTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Connection:</span>
                    <span className={`font-medium ${safeSyncStatus.isOnline ? 'text-green-600' : 'text-red-600'}`}>
                      {safeSyncStatus.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-3">Sync Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={forceSync}
                    disabled={safeSyncStatus.syncInProgress || !safeSyncStatus.hasToken}
                    className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {safeSyncStatus.syncInProgress ? 'Syncing...' : 'Force Sync'}
                  </button>

                  <button
                    onClick={() => toggleAutoSync(!safeSyncStatus.autoSyncEnabled)}
                    className="bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                  >
                    {safeSyncStatus.autoSyncEnabled ? 'Disable Auto' : 'Enable Auto'}
                  </button>

                  <button
                    onClick={exportBackup}
                    className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
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
                      className="w-full bg-orange-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      disabled={importFile}
                    >
                      {importFile ? 'Importing...' : 'Import Backup'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sync History */}
            {syncHistory.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-medium text-gray-900 mb-3">Recent Sync Activity</h3>
                <div className="space-y-2">
                  {syncHistory.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${item.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-gray-600 capitalize">
                          {item.action?.replace(/_/g, ' ') || 'Unknown action'}
                        </span>
                      </div>
                      <span className="text-gray-500">{formatTimeAgo(item.timestamp)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        {analytics?.recentActions?.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {analytics.recentActions.slice(0, 10).map((action, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-xs font-medium">
                          {action.action.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-gray-700 capitalize">
                        {action.action.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(action.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Account Actions</h3>
              <p className="text-sm text-gray-600">Manage your account settings and data</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Phone Verification Modal */}
        <PhoneVerificationModal
          isOpen={showPhoneModal}
          onClose={() => setShowPhoneModal(false)}
          onVerified={async () => {
            // Refresh latest user profile after verification
            // We have no dedicated fetch endpoint; re-read from local service
            const refreshed = userService.getCurrentUser()
            setUser({ ...refreshed })
          }}
        />
      </div>
    </div>
  )
}

export default ProfileScreen
