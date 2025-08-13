import React, { useEffect, useState } from 'react'
import Modal from '../Common/Modal'
import otpService from '../../services/otpService'
import userService from '../../services/userService'

const PhoneVerificationModal = ({ isOpen, onClose, onVerified }) => {
  const [step, setStep] = useState('collect') // 'collect' | 'verify'
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [code, setCode] = useState('')
  const [lastOtp, setLastOtp] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setStep('collect')
      setSubmitting(false)
      setError('')
      setPhoneNumber('')
      setCode('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSendCode = async (e) => {
    e?.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const user = userService.getCurrentUser()
      if (!user) throw new Error('Not authenticated')
      if (!phoneNumber) throw new Error('Enter a valid phone number')
      const result = await otpService.sendPhoneOtp({ userId: user.id, phoneNumber })

      // Optimistically store phone on user (unverified)
      await userService.updateUserProfile({ phone_number: phoneNumber, phone_verified: false })
      // No longer expose OTP in UI for security
      setStep('verify')
    } catch (err) {
      setError(err.message || 'Failed to send code')
    } finally {
      setSubmitting(false)
    }
  }

  const handleVerify = async (e) => {
    e?.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const user = userService.getCurrentUser()
      if (!user) throw new Error('Not authenticated')
      if (!code || code.length < 4) throw new Error('Enter the OTP')
      await otpService.verifyPhoneOtp({ userId: user.id, phoneNumber, code })
      // Mark verified
      await userService.updateUserProfile({ phone_number: phoneNumber, phone_verified: true })
      onVerified?.({ phoneNumber })
      onClose?.()
    } catch (err) {
      setError(err.message || 'Verification failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Verify your mobile number</h2>
        <p className="text-sm text-gray-500 mb-4">We use this to secure your account and for important notifications.</p>

        {error ? (
          <div className="mb-4 text-sm text-red-600">{error}</div>
        ) : null}

        {step === 'collect' && (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700">Cancel</button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
              >{submitting ? 'Sending...' : 'Send OTP'}</button>
            </div>
          </form>
        )}

        {step === 'verify' && (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="6-digit code"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 tracking-widest"
              />
              <p className="mt-2 text-xs text-gray-500">Code sent to {phoneNumber}. <button type="button" className="text-blue-600" onClick={() => setStep('collect')}>Change</button></p>
              {/* testing OTP banner removed */}
            </div>
            <div className="flex items-center justify-between">
              <button type="button" className="text-sm text-gray-600" onClick={handleSendCode} disabled={submitting}>Resend code</button>
              <div className="flex items-center gap-2">
                <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700">Cancel</button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-green-600 text-white rounded-md disabled:opacity-50"
                >{submitting ? 'Verifying...' : 'Verify'}</button>
              </div>
            </div>
          </form>
        )}
      </div>
    </Modal>
  )
}

export default PhoneVerificationModal


