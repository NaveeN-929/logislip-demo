import React from 'react'
import Modal from '../Common/Modal'

const CancelSubscriptionConfirm = ({ isOpen, onClose, onConfirm, loading = false }) => {
  if (!isOpen) return null

  return (
    <Modal onClose={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancel subscription?</h3>
        <p className="text-sm text-gray-600 mb-4">
          Your plan benefits will end immediately and you'll be moved to the Free plan. You can upgrade again anytime.
        </p>
        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700">
            Keep plan
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-md disabled:opacity-50"
          >
            {loading ? 'Cancelling...' : 'Cancel subscription'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default CancelSubscriptionConfirm


