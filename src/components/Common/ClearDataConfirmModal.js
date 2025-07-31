import React, { useState } from "react";
import Modal from "../Common/Modal";

// Secret string for confirmation
const SECRET_STRING = "logislip-clear";

/**
 * Confirmation modal for clearing selected stored data (localStorage/localforage).
 * Props:
 *   open: boolean
 *   onClose: () => void
 *   onConfirm: (selectedData) => void
 */
const ClearDataConfirmModal = ({ open, onClose, onConfirm }) => {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [selectedData, setSelectedData] = useState({
    clients: false,
    products: false,
    invoices: false,
    settings: false,
    forms: false,
  });

  const dataTypes = [
    { key: 'clients', label: 'Clients', description: 'All saved client information and contact details' },
    { key: 'products', label: 'Products', description: 'All product definitions and pricing' },
    { key: 'invoices', label: 'Invoices', description: 'All invoices and invoice history' },
    { key: 'settings', label: 'Settings', description: 'App preferences, colors, and backgrounds' },
    { key: 'forms', label: 'Draft Forms', description: 'Unsaved form data and temporary entries' },
  ];

  const handleCheckboxChange = (key) => {
    setSelectedData(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const hasSelectedData = Object.values(selectedData).some(value => value);

  const handleConfirm = () => {
    if (!hasSelectedData) {
      setError("Please select at least one data type to clear.");
      return;
    }
    
    if (input.trim() === SECRET_STRING) {
      setError("");
      onConfirm(selectedData);
    } else {
      setError(`You must type ${SECRET_STRING} to confirm.`);
    }
  };

  const handleSelectAll = () => {
    const allSelected = Object.values(selectedData).every(value => value);
    const newValue = !allSelected;
    setSelectedData({
      clients: newValue,
      products: newValue,
      invoices: newValue,
      settings: newValue,
      forms: newValue,
    });
  };

  if (!open) return null;
  return (
    <Modal onClose={onClose}>
      <div className="p-6 max-w-lg mx-auto">
        <h2 className="text-xl font-bold mb-3 text-center">Clear Selected Data</h2>
        <p className="mb-4 text-gray-600 text-center text-sm">
          Choose which data you want to permanently delete from this browser. This action cannot be undone.
        </p>
        
        {/* Select All Option */}
        <div className="mb-4 pb-3 border-b border-gray-200">
          <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
            <input
              type="checkbox"
              className="mr-3 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              checked={Object.values(selectedData).every(value => value)}
              onChange={handleSelectAll}
            />
            <div>
              <div className="font-medium text-gray-900">Select All</div>
              <div className="text-xs text-gray-500">Clear all data types</div>
            </div>
          </label>
        </div>

        {/* Individual Data Type Checkboxes */}
        <div className="space-y-2 mb-4">
          {dataTypes.map(({ key, label, description }) => (
            <label key={key} className="flex items-start cursor-pointer hover:bg-gray-50 p-2 rounded">
              <input
                type="checkbox"
                className="mr-3 mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                checked={selectedData[key]}
                onChange={() => handleCheckboxChange(key)}
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">{label}</div>
                <div className="text-xs text-gray-500">{description}</div>
              </div>
            </label>
          ))}
        </div>

        {/* Confirmation Input */}
        {hasSelectedData && (
          <div className="mb-4 p-3 bg-red-50 rounded border border-red-200">
            <label htmlFor="delete-confirm" className="block text-sm mb-2 text-red-800">
              Type <span className="font-mono font-bold text-red-600">{SECRET_STRING}</span> to confirm deletion:
            </label>
            <input
              id="delete-confirm"
              type="text"
              className="w-full px-3 py-2 border border-red-300 rounded focus:outline-none focus:ring-2 focus:ring-red-400"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={SECRET_STRING}
            />
            {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center gap-3 mt-6">
          <button
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-semibold shadow disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleConfirm}
            disabled={!hasSelectedData || input.trim() !== SECRET_STRING}
          >
            Clear Selected Data
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ClearDataConfirmModal;
