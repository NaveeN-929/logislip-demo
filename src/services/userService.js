import { supabase } from '../config/supabase'
import { v4 as uuidv4 } from 'uuid'
import Cookies from 'js-cookie'
import { sanitizeDataForStorage } from '../utils/storage'
import secureLogger from '../utils/secureLogger'

class UserService {
  constructor() {
    this.currentUser = null
    this.sessionToken = null
    this.initializeFromStorage()
  }

  // Initialize user data from local storage
  initializeFromStorage() {
    const storedUser = localStorage.getItem('logislip_user')
    const storedToken = Cookies.get('logislip_session')
    
    if (storedUser && storedToken) {
      this.currentUser = JSON.parse(storedUser)
      this.sessionToken = storedToken
      
      // Ensure avatar exists - generate one if missing
      if (this.currentUser) {
        if (!this.currentUser.avatar_url) {
          this.currentUser.avatar_url = this.getUserAvatar(this.currentUser.email)
          localStorage.setItem('logislip_user', JSON.stringify(this.currentUser))
        }
      }
    }
  }

  // Get or generate user avatar with persistence
  getUserAvatar(email, forceRegenerate = false) {
    const avatarKey = `logislip_avatar_${email}`;
    
    // Check if we have a stored avatar (unless forcing regeneration)
    if (!forceRegenerate) {
      const storedAvatar = localStorage.getItem(avatarKey);
      if (storedAvatar) {
        return storedAvatar;
      }
    }
    
    // Generate new avatar
    const newAvatar = this.generateRandomAvatar(email, forceRegenerate);
    
    // Store it persistently
    localStorage.setItem(avatarKey, newAvatar);
    
    return newAvatar;
  }

  // Generate random avatar URL using DiceBear API
  generateRandomAvatar(seed, forceNew = false) {
    // Available avatar styles - choosing ones that work well for profile pictures
    const avatarStyles = [
      'avataaars',       // Human-like avatars
      'adventurer',      // Stylish human avatars
      'lorelei',         // Modern minimal avatars
      'personas',        // Professional avatars
      'notionists',      // Clean modern style
      'open-peeps'       // Hand-drawn style
    ];
    
    // If forcing new avatar, add timestamp to seed
    const avatarSeed = forceNew ? `${seed}-${Date.now()}` : seed;
    
    // Pick a random style or use user preference
    const randomStyle = avatarStyles[Math.floor(Math.random() * avatarStyles.length)];
    
    // Use email or user ID as seed to ensure consistency
    const encodedSeed = encodeURIComponent(avatarSeed);
    
    // Return DiceBear API URL - using SVG for better quality and smaller size
    return `https://api.dicebear.com/9.x/${randomStyle}/svg?seed=${encodedSeed}&size=128`;
  }

  // Get user profile from Google OAuth
  async getUserProfile(accessToken) {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch user profile')
      }
      
      return await response.json()
    } catch (error) {
      secureLogger.error('Error fetching user profile:', error)
      throw error
    }
  }

  // Register or login user
  async authenticateUser(googleProfile, accessToken) {
    try {
      // Check if Supabase is configured
      if (!process.env.REACT_APP_SUPABASE_URL || 
          process.env.REACT_APP_SUPABASE_URL === 'https://your-project.supabase.co' ||
          !process.env.REACT_APP_SUPABASE_ANON_KEY ||
          process.env.REACT_APP_SUPABASE_ANON_KEY === 'your-supabase-anon-key') {
        secureLogger.warn('🟡 Supabase not fully configured. Using fallback authentication.');
        // Check for stored avatar first, then Google picture, then generate new
        const avatarKey = `logislip_avatar_${googleProfile.email}`;
        const storedAvatar = localStorage.getItem(avatarKey);
        
        const avatarUrl = storedAvatar || googleProfile.picture || this.getUserAvatar(googleProfile.email);
        
        // Return mock user for development with proper Free plan limits
        const mockUser = {
          id: 'demo-user-' + googleProfile.id,
          google_id: googleProfile.id,
          email: googleProfile.email,
          name: googleProfile.name,
          avatar_url: avatarUrl,
          subscription_tier: 'free',
          subscription_status: 'active',
          usage_limit: 3, // Free plan limit for invoices
          usage_count: 0,
          created_at: new Date().toISOString()
        };
        
        this.currentUser = mockUser;
        localStorage.setItem('logislip_user', JSON.stringify(mockUser));
        return mockUser;
      }
      
      // Check if user exists
      const { data: existingUser, error: _fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('google_id', googleProfile.id)
        .single()

      let user
      if (existingUser) {
        // Update last login - prioritize database avatar for consistency
        // Check if we have a stored persistent avatar
        const avatarKey = `logislip_avatar_${googleProfile.email}`;
        const storedAvatar = localStorage.getItem(avatarKey);
        
        // Prioritize: stored avatar -> database avatar -> Google picture -> generate new
        const avatarUrl = storedAvatar || existingUser.avatar_url || googleProfile.picture || this.getUserAvatar(googleProfile.email);
        
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({ 
            last_login: new Date().toISOString(),
            name: googleProfile.name,
            avatar_url: avatarUrl
          })
          .eq('id', existingUser.id)
          .select()
          .single()

        if (updateError) throw updateError
        user = updatedUser
      } else {
        // Create new user - generate random avatar if Google doesn't provide picture
        const avatarUrl = googleProfile.picture || this.getUserAvatar(googleProfile.email);
        
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            google_id: googleProfile.id,
            email: googleProfile.email,
            name: googleProfile.name,
            avatar_url: avatarUrl,
            subscription_tier: 'free',
            subscription_status: 'active',
            usage_count: 0,
            usage_limit: 3 // Free plan limit for invoices
          })
          .select()
          .single()

        if (createError) throw createError
        user = newUser
      }

      // Create session
      const sessionToken = uuidv4()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

      const { error: sessionError } = await supabase
        .from('user_sessions')
        .insert({
          user_id: user.id,
          session_token: sessionToken,
          expires_at: expiresAt.toISOString()
        })

      if (sessionError) throw sessionError

      // Store user data
      this.currentUser = user
      this.sessionToken = sessionToken
      
      localStorage.setItem('logislip_user', JSON.stringify(user))
      Cookies.set('logislip_session', sessionToken, { expires: 7 })

      // Log authentication
      await this.logUserAction('login', { 
        google_id: googleProfile.id,
        login_time: new Date().toISOString()
      })

      return user
    } catch (error) {
      secureLogger.error('Authentication error:', error)
      throw error
    }
  }

  // Check if user session is valid
  async validateSession() {
    if (!this.sessionToken || !this.currentUser) {
      return false
    }

    try {
      // Check if Supabase is configured
      if (!process.env.REACT_APP_SUPABASE_URL || 
          process.env.REACT_APP_SUPABASE_URL === 'https://your-project.supabase.co' ||
          !process.env.REACT_APP_SUPABASE_ANON_KEY ||
          process.env.REACT_APP_SUPABASE_ANON_KEY === 'your-supabase-anon-key') {
        // In fallback mode, just check if user exists in localStorage
        return !!this.currentUser;
      }

      const { data: session, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('session_token', this.sessionToken)
        .eq('user_id', this.currentUser.id)
        .single()

      if (error || !session) {
        this.logout()
        return false
      }

      // Check if session is expired
      if (new Date(session.expires_at) < new Date()) {
        await this.logout()
        return false
      }

      return true
    } catch (error) {
      secureLogger.error('❌ Session validation error:', error)
      // Don't logout in fallback mode, just return false
      if (!process.env.REACT_APP_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL === 'https://your-project.supabase.co') {
        return !!this.currentUser;
      }
      this.logout()
      return false
    }
  }

  // Log user actions for tracking
  async logUserAction(action, details = {}) {
    if (!this.currentUser) return

    try {
      await supabase
        .from('usage_logs')
        .insert({
          user_id: this.currentUser.id,
          action,
          details
        })
    } catch (error) {
      secureLogger.error('Error logging user action:', error)
    }
  }

  // Check usage limits
  async checkUsageLimit(action = 'invoice_create') {
    if (!this.currentUser) return false

    try {
      // Check if Supabase is configured
      if (!process.env.REACT_APP_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL === 'https://your-project.supabase.co') {
        // Use local data for development
        return this.currentUser.usage_count < this.currentUser.usage_limit;
      }
      
      // Get current user data
      const { data: user, error } = await supabase
        .from('users')
        .select('usage_count, usage_limit, subscription_tier')
        .eq('id', this.currentUser.id)
        .single()

      if (error) throw error

      // Update local user data
      this.currentUser = { ...this.currentUser, ...user }
      localStorage.setItem('logislip_user', JSON.stringify(this.currentUser))

      return user.usage_count < user.usage_limit
    } catch (error) {
      secureLogger.error('Error checking usage limit:', error)
      return this.currentUser.usage_count < this.currentUser.usage_limit
    }
  }

  // Increment usage count
  async incrementUsage(action = 'invoice_create') {
    if (!this.currentUser) return

    try {
      // Check if Supabase is configured
      if (!process.env.REACT_APP_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL === 'https://your-project.supabase.co') {
        // Use local storage for development
        this.currentUser.usage_count += 1;
        localStorage.setItem('logislip_user', JSON.stringify(this.currentUser));
        return this.currentUser;
      }
      
      const { data: updatedUser, error } = await supabase
        .from('users')
        .update({ 
          usage_count: this.currentUser.usage_count + 1 
        })
        .eq('id', this.currentUser.id)
        .select()
        .single()

      if (error) throw error

      this.currentUser = updatedUser
      localStorage.setItem('logislip_user', JSON.stringify(this.currentUser))

      // Log the usage
      await this.logUserAction(action, {
        new_usage_count: updatedUser.usage_count,
        usage_limit: updatedUser.usage_limit
      })

      return updatedUser
    } catch (error) {
      secureLogger.error('Error incrementing usage:', error)
      // Fallback to local increment
      this.currentUser.usage_count += 1;
      localStorage.setItem('logislip_user', JSON.stringify(this.currentUser));
      return this.currentUser;
    }
  }

  // Get subscription plans
  async getSubscriptionPlans() {
    try {
      const { data: plans, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('active', true)
        .order('price', { ascending: true })

      if (error) throw error
      return plans
    } catch (error) {
      secureLogger.error('Error fetching subscription plans:', error)
      return []
    }
  }

  // Update user subscription
  async updateSubscription(subscriptionData) {
    if (!this.currentUser) return

    try {
      const { data: updatedUser, error } = await supabase
        .from('users')
        .update({
          subscription_tier: subscriptionData.tier,
          subscription_status: subscriptionData.status,
          subscription_end_date: subscriptionData.endDate,
          usage_limit: subscriptionData.usageLimit,
          usage_count: 0 // Reset usage count on subscription change
        })
        .eq('id', this.currentUser.id)
        .select()
        .single()

      if (error) throw error

      this.currentUser = updatedUser
      localStorage.setItem('logislip_user', JSON.stringify(this.currentUser))

      await this.logUserAction('subscription_updated', subscriptionData)

      return updatedUser
    } catch (error) {
      secureLogger.error('Error updating subscription:', error)
      throw error
    }
  }

  // Get user analytics
  async getUserAnalytics() {
    if (!this.currentUser) return null

    try {
      const { data: logs, error } = await supabase
        .from('usage_logs')
        .select('*')
        .eq('user_id', this.currentUser.id)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      // Process analytics data
      const analytics = {
        totalActions: logs.length,
        recentActions: logs.slice(0, 10),
        actionCounts: logs.reduce((acc, log) => {
          acc[log.action] = (acc[log.action] || 0) + 1
          return acc
        }, {}),
        lastActivity: logs[0]?.created_at
      }

      return analytics
    } catch (error) {
      secureLogger.error('Error fetching user analytics:', error)
      return null
    }
  }

  // Debug function to check avatar storage
  debugAvatarStorage() {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('logislip_avatar_')) {
        // Avatar storage check (for debugging)
      }
    }
  }

  // Logout user
  async logout() {
    try {
      if (this.sessionToken) {
        // Delete session from database
        await supabase
          .from('user_sessions')
          .delete()
          .eq('session_token', this.sessionToken)
      }
    } catch (error) {
      secureLogger.error('Error during logout:', error)
    }

    // Clear local data but preserve avatar storage
    this.currentUser = null
    this.sessionToken = null
    localStorage.removeItem('logislip_user')
    Cookies.remove('logislip_session')
    
    // Note: We intentionally keep avatar storage (logislip_avatar_*) 
    // so users don't lose their generated avatars between sessions
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.currentUser && !!this.sessionToken
  }

  // Get user's remaining usage
  getRemainingUsage() {
    if (!this.currentUser) return 0
    return Math.max(0, this.currentUser.usage_limit - this.currentUser.usage_count)
  }

  // Check if user has premium features
  hasPremiumFeatures() {
    return this.currentUser?.subscription_tier !== 'free'
  }

  // Regenerate user avatar - creates a new random avatar
  async regenerateUserAvatar() {
    if (!this.currentUser) {
      throw new Error('No user logged in');
    }

    try {
      // Generate new random avatar - force regeneration
      const newAvatarUrl = this.getUserAvatar(this.currentUser.email, true);

      // Check if Supabase is configured
      if (!process.env.REACT_APP_SUPABASE_URL || 
          process.env.REACT_APP_SUPABASE_URL === 'https://your-project.supabase.co' ||
          !process.env.REACT_APP_SUPABASE_ANON_KEY ||
          process.env.REACT_APP_SUPABASE_ANON_KEY === 'your-supabase-anon-key') {
        // Update local storage in fallback mode
        this.currentUser.avatar_url = newAvatarUrl;
        localStorage.setItem('logislip_user', JSON.stringify(this.currentUser));
        return this.currentUser;
      }

      // Update in database
      const { data: updatedUser, error } = await supabase
        .from('users')
        .update({ avatar_url: newAvatarUrl })
        .eq('id', this.currentUser.id)
        .select()
        .single();

      if (error) throw error;

      // Update local user data
      this.currentUser = updatedUser;
      localStorage.setItem('logislip_user', JSON.stringify(this.currentUser));

      // Log the action
      await this.logUserAction('avatar_regenerated', {
        new_avatar_url: newAvatarUrl
      });

      return updatedUser;
    } catch (error) {
      secureLogger.error('Error regenerating avatar:', error);
      throw error;
    }
  }

  // Initialize user avatar if missing
  initializeAvatar() {
    if (this.currentUser && !this.currentUser.avatar_url) {
      this.currentUser.avatar_url = this.generateAvatarUrl(this.currentUser.email);
      localStorage.setItem('logislip_current_user', JSON.stringify(this.currentUser));
    }
  }

  // Generate avatar URL based on email
  generateAvatarUrl(email, forceRegenerate = false) {
    const storedKey = `avatar_${email}`;
    const storedAvatar = localStorage.getItem(storedKey);
    
    if (storedAvatar && !forceRegenerate) {
      return storedAvatar;
    }

    // Generate using DiceBear API
    const seed = encodeURIComponent(email);
    const style = 'initials'; // You can change this to other styles like 'avataaars', 'bottts', etc.
    const newAvatar = `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=random`;
    
    // Store avatar URL
    localStorage.setItem(storedKey, newAvatar);
    
    // Verify storage
    const confirmedStored = localStorage.getItem(storedKey);
    
    return newAvatar;
  }
}

// Create singleton instance
const userService = new UserService()
export default userService 