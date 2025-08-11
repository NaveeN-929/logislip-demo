import { supabase } from '../config/supabase'
import secureLogger from '../utils/secureLogger'

/**
 * OTP service: wraps Supabase Edge Functions for phone verification
 */
class OtpService {
  async sendPhoneOtp({ userId, phoneNumber }) {
    try {
      const { data, error } = await supabase.functions.invoke('phone-otp-send', {
        body: { userId, phoneNumber }
      })
      if (error) throw error
      return data
    } catch (err) {
      secureLogger.error('Error sending phone OTP:', err)
      throw new Error(err?.message || 'Failed to send OTP')
    }
  }

  async verifyPhoneOtp({ userId, phoneNumber, code }) {
    try {
      const { data, error } = await supabase.functions.invoke('phone-otp-verify', {
        body: { userId, phoneNumber, code }
      })
      if (error) throw error
      return data
    } catch (err) {
      secureLogger.error('Error verifying phone OTP:', err)
      throw new Error(err?.message || 'Failed to verify OTP')
    }
  }
}

const otpService = new OtpService()
export default otpService


