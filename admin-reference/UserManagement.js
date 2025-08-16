import React, { useState, useEffect } from "react";
import adminService from "../../services/adminService";
import planConfigService from "../../services/planConfigService";
import { toast } from "react-toastify";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function UserCard({ user, onEditSubscription, onResetUsage, availablePlans = [] }) {
  const getSubscriptionBadge = (tier) => {
    // Handle guest users (null subscription_tier)
    if (tier === null || tier === undefined) {
      return "bg-orange-100 text-orange-800";
    }
    
    // Dynamic badge colors based on plan price
    const plan = availablePlans.find(p => p.value === tier);
    if (!plan) return "bg-gray-100 text-gray-800";
    
    if (plan.price === 0) return "bg-gray-100 text-gray-800";
    if (plan.price < 1000) return "bg-blue-100 text-blue-800";
    if (plan.price < 5000) return "bg-purple-100 text-purple-800";
    return "bg-green-100 text-green-800";
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
      suspended: "bg-red-100 text-red-800"
    };
    return badges[status] || badges.inactive;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getDaysUntilExpiry = (dateString) => {
    if (!dateString) return null;
    const expiry = new Date(dateString);
    const today = new Date();
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilExpiry = getDaysUntilExpiry(user.subscription_end_date);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500">Subscription</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getSubscriptionBadge(user.subscription_tier)}`}>
                {user.subscription_tier === null || user.subscription_tier === undefined ? 'Guest' : user.subscription_tier}
              </span>
              {user.subscription_end_date && (
                <p className="text-xs text-gray-500 mt-1">
                  Expires: {formatDate(user.subscription_end_date)}
                  {daysUntilExpiry !== null && (
                    <span className={`ml-1 ${daysUntilExpiry <= 7 ? 'text-red-600' : 'text-gray-600'}`}>
                      ({daysUntilExpiry > 0 ? `${daysUntilExpiry} days left` : 'Expired'})
                    </span>
                  )}
                </p>
              )}
            </div>

            <div>
              <p className="text-sm text-gray-500">Status</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusBadge(user.status)}`}>
                {user.status}
              </span>
              <p className="text-xs text-gray-500 mt-1">
                Last login: {formatDate(user.last_login)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500">Usage</p>
              <p className="font-semibold">
                {user.subscription_tier === null || user.subscription_tier === undefined 
                  ? 'Guest User' 
                  : `${user.usage_count}${user.usage_limit >= 999999 ? '' : `/${user.usage_limit}`}`
                }
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Joined</p>
              <p className="font-semibold">{formatDate(user.created_at)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">User ID</p>
              <p className="font-semibold text-xs">{user.id}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex space-x-2 pt-4 border-t border-gray-100">
        <button
          onClick={() => onEditSubscription(user)}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Edit Subscription
        </button>
        <button
          onClick={(e) => {
            try {
              e.preventDefault();
              e.stopPropagation();
              onResetUsage(user);
            } catch (error) {
              console.error('❌ Error in onClick handler:', error);
              toast.error('Error handling button click');
            }
          }}
          className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
          title="Reset usage count to 0"
        >
          Reset Usage
        </button>
      </div>
    </div>
  );
}

function SubscriptionModal({ isOpen, onClose, user, onSave }) {
  const [subscriptionData, setSubscriptionData] = useState({
    tier: null,
    endDate: new Date()
  });
  const [availablePlans, setAvailablePlans] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const planOptions = await planConfigService.getPlanOptions();
        setAvailablePlans(planOptions);
      } catch (error) {
        console.error('Error loading plans:', error);
      }
    };
    
    loadPlans();
  }, []);

  useEffect(() => {
    if (user) {
      setSubscriptionData({
        tier: user.subscription_tier || null,
        endDate: user.subscription_end_date ? new Date(user.subscription_end_date) : new Date()
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (saving) return; // Prevent multiple simultaneous saves
    
    try {
      setSaving(true);
      console.log('📝 SubscriptionModal handleSave called with:', user.id, subscriptionData);
      await onSave(user.id, subscriptionData);
      onClose();
    } catch (error) {
      console.error('❌ Error in SubscriptionModal handleSave:', error);
      toast.error('Failed to update subscription: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Edit Subscription for {user.name}</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subscription Tier
            </label>
            <select
              value={subscriptionData.tier || ''}
              onChange={(e) => setSubscriptionData(prev => ({ ...prev, tier: e.target.value || null }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Plan</option>
              <option value="guest">Guest User (No Access)</option>
              {availablePlans.map(plan => (
                <option key={plan.value} value={plan.value}>
                  {plan.label} {plan.price > 0 ? `(₹${plan.price}/month)` : '(Free)'}
                </option>
              ))}
            </select>
          </div>

          {subscriptionData.tier === 'guest' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-orange-800">Guest User Selected</h3>
                  <p className="text-sm text-orange-700 mt-1">
                    This user will have no access to create, save, or export invoices. They can only browse templates and view subscription plans.
                  </p>
                </div>
              </div>
            </div>
          )}

          {subscriptionData.tier && subscriptionData.tier !== 'guest' && availablePlans.find(p => p.value === subscriptionData.tier)?.price > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subscription End Date
              </label>
              <DatePicker
                selected={subscriptionData.endDate}
                onChange={(date) => setSubscriptionData(prev => ({ ...prev, endDate: date }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                dateFormat="dd/MM/yyyy"
                minDate={new Date()}
              />
            </div>
          )}
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {saving && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    subscription: '',
    status: ''
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [availablePlans, setAvailablePlans] = useState([]);

  useEffect(() => {
    loadUsers();
    loadPlans();
  }, [filters]);

  const loadPlans = async () => {
    try {
      const planOptions = await planConfigService.getPlanOptions();
      setAvailablePlans(planOptions);
    } catch (error) {
      console.error('Error loading plans:', error);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading users with filters:', filters);
      const response = await adminService.getAllUsers(filters);
      console.log('✅ Users loaded:', response);
      setUsers(response.users || []);
      setPagination(response.pagination);
    } catch (error) {
      console.error('❌ Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubscription = (user) => {
    setSelectedUser(user);
    setShowSubscriptionModal(true);
  };

  const handleSaveSubscription = async (userId, subscriptionData) => {
    try {
      console.log('💾 Saving subscription for user:', userId, subscriptionData);
      await adminService.updateUserSubscription(userId, subscriptionData);
      
      // Update local state immediately for better UX
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { 
                ...user, 
                subscription_tier: subscriptionData.tier === 'guest' ? null : subscriptionData.tier,
                subscription_status: subscriptionData.tier === 'guest' ? 'guest' : 'active',
                subscription_end_date: subscriptionData.endDate?.toISOString() || null
              }
            : user
        )
      );
      
      // Also reload users from server to ensure consistency
      await loadUsers();
      
      toast.success('Subscription updated successfully');
    } catch (error) {
      console.error('❌ Error in handleSaveSubscription:', error);
      toast.error('Failed to update subscription: ' + error.message);
      throw error;
    }
  };

  const handleResetUsage = (user) => {
    // Input validation
    if (!user || !user.id || !user.email) {
      console.error('❌ Invalid user data:', user);
      toast.error('Invalid user data provided');
      return;
    }

    // Show confirmation dialog
    const confirmReset = window.confirm(
      `Are you sure you want to reset the usage count for ${user.name} (${user.email})?\n\nThis will set their usage count back to 0.`
    );
    
    if (!confirmReset) {
      return;
    }

    // Use async function internally to avoid React issues
    const performReset = async () => {
      try {
        console.log('🔄 Starting usage count reset for user:', {
          id: user.id,
          email: user.email,
          name: user.name,
          currentUsage: user.usage_count
        });

        // Check if adminService is available
        if (!adminService || typeof adminService.resetUserUsageCount !== 'function') {
          console.error('❌ AdminService or resetUserUsageCount method not available');
          toast.error('Admin service not available. Please refresh the page.');
          return;
        }

        const result = await adminService.resetUserUsageCount(user.id, user.email);
        console.log('✅ Reset result:', result);
        
        // Update local state immediately for better UX
        setUsers(prevUsers => 
          prevUsers.map(u => 
            u.id === user.id 
              ? { ...u, usage_count: 0 }
              : u
          )
        );
        
        toast.success(`Usage count reset to 0 for ${user.name}`);
      } catch (error) {
        console.error('❌ Error in performReset:', error);
        
        // More specific error messages
        let errorMessage = 'Failed to reset usage count';
        if (error?.message) {
          errorMessage += ': ' + error.message;
        }
        
        toast.error(errorMessage);
      }
    };

    // Execute the async function and handle any unhandled promises
    performReset().catch(error => {
      console.error('❌ Unhandled error in performReset:', error);
      toast.error('An unexpected error occurred while resetting usage count');
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
          <p className="text-gray-600">Manage user accounts and subscriptions</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Users
              </label>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subscription Tier
              </label>
              <select
                value={filters.subscription}
                onChange={(e) => setFilters(prev => ({ ...prev, subscription: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Tiers</option>
                <option value="guest">Guest</option>
                {availablePlans.map(plan => (
                  <option key={plan.value} value={plan.value}>
                    {plan.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                  <div className="ml-3">
                    <div className="h-4 bg-gray-300 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-48"></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-3 bg-gray-300 rounded"></div>
                  <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
            <p className="text-gray-600">
              {Object.values(filters).some(filter => filter) ? 
                'No users match your current filters.' : 
                'No users have been loaded yet.'}
            </p>
            <button
              onClick={loadUsers}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reload Users
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-gray-600">
                Showing {users.length} user{users.length !== 1 ? 's' : ''}
              </p>
              <button
                onClick={loadUsers}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Refresh
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map(user => (
                <UserCard
                  key={user.id}
                  user={user}
                  onEditSubscription={handleEditSubscription}
                  onResetUsage={handleResetUsage}
                  availablePlans={availablePlans}
                />
              ))}
            </div>
          </>
        )}

        {/* Modals */}
        <SubscriptionModal
          isOpen={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
          user={selectedUser}
          onSave={handleSaveSubscription}
        />
      </div>
    </div>
  );
}

export default UserManagement; 