import React, { useState, useEffect } from 'react';
import Modal from '../Common/Modal';
import userService from '../../services/userService';
import { sendGmailHtmlEmail, formatInvoiceEmail, sendGmailHtmlEmailWithAttachment, formatInvoiceEmailWithAttachment } from '../../utils/gmail';
import { generateInvoicePDF, generateInvoicePDFFilename } from '../../utils/pdf';
import secureLogger from '../../utils/secureLogger';

const ShareInvoice = ({ 
  isOpen, 
  onClose, 
  invoice, 
  componentRef = null, 
  selectedTemplate = 'default',
  isViewMode = false,
  isExporting = false,
  setIsViewMode = null,
  setIsExporting = null,
  setEscapeOverflow = null,
  showNavbar = false,
  toggleNavbar = null
}) => {
  const [emailRecipient, setEmailRecipient] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState({ type: '', message: '' });
  const [hasGmailAccess, setHasGmailAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(false);

  // Check Gmail access
  const checkGmailAccessStatus = async () => {
    try {
    const token = window.googleAuthDrive?.token || localStorage.getItem('googleAccessToken');
    
    if (token) {
        setCheckingAccess(true);
        
        // Simple check - try to make a test request to Gmail API
        const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });
        
        if (response.ok) {
          setHasGmailAccess(true);
        } else {
          setHasGmailAccess(false);
        }
      } else {
        setHasGmailAccess(false);
      }
    } catch (error) {
      secureLogger.error('Gmail access check failed:', error);
      setHasGmailAccess(false);
    } finally {
      setCheckingAccess(false);
    }
  };

  // Get current user and check Gmail access
  useEffect(() => {
    const user = userService.getCurrentUser();
    setCurrentUser(user);
    
    // Initial check with retry mechanism
    const performInitialCheck = async () => {
      // First immediate check
      await checkGmailAccessStatus();
      
      // If no Gmail access found, wait a bit and try again
      // This handles cases where token initialization is delayed
      setTimeout(async () => {
        if (!hasGmailAccess) {
          // Silent - Gmail access retries should not log
          await checkGmailAccessStatus();
        }
      }, 500);
    };
    
    performInitialCheck();
    
    // Listen for custom Google token updates
    const handleTokenUpdate = (event) => {
        // Silent - token updates should not log sensitive information
        checkGmailAccessStatus();
    };
    
    // Listen for storage changes (fallback for localStorage updates)
    const handleStorageChange = (e) => {
      if (e.key === 'googleAccessToken') {
          // Silent - token storage changes should not log sensitive information
          checkGmailAccessStatus();
      }
    };
    
    window.addEventListener('googleTokenUpdated', handleTokenUpdate);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('googleTokenUpdated', handleTokenUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pre-fill email with client's email when invoice changes
  useEffect(() => {
    if (invoice?.clientDetail?.email) {
      setEmailRecipient(invoice.clientDetail.email);
    } else {
      setEmailRecipient('');
    }
    // Reset status when invoice changes
    setEmailStatus({ type: '', message: '' });
  }, [invoice]);

  const generateInvoiceText = () => {
    const text = `Invoice: ${invoice.invoiceNo}
Client: ${invoice.clientName}
Amount: $${invoice.totalAmount?.toLocaleString() || '0'}
Status: ${invoice.statusName}

View invoice details at: ${window.location.origin}/invoices/${invoice.id}`;
    return text;
  };

  // Manual refresh function
  const refreshGmailAccess = async () => {
    try {
    const token = window.googleAuthDrive?.token || localStorage.getItem('googleAccessToken');
    
    if (token) {
        // Check Gmail API access
        const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });
        
        if (response.ok) {
          setHasGmailAccess(true);
        } else {
          setHasGmailAccess(false);
        }
        } else {
        setHasGmailAccess(false);
      }
    } catch (error) {
      secureLogger.error('Gmail access refresh failed:', error);
      setHasGmailAccess(false);
    }
  };

  const handleEmailShare = async () => {
    if (!emailRecipient.trim()) {
      setEmailStatus({ type: 'error', message: 'Please enter an email address' });
      return;
    }

    setIsLoading(true);
    setEmailStatus({ type: '', message: '' });

    try {
      const token = window.googleAuthDrive?.token || localStorage.getItem('googleAccessToken');
      
      if (!token) {
        setEmailStatus({ 
          type: 'error', 
          message: 'Please sign in with Google to send emails' 
        });
        return;
      }

      // Check if we can generate PDF (need componentRef)
      if (componentRef && componentRef.current) {
        // Generate PDF and send with attachment (similar to InvoiceDetailScreen)
        
        // Store original states to restore later
        const originalNavbarState = showNavbar;
        const originalViewMode = isViewMode;
        const originalExporting = isExporting;
        
        // Set export mode for PDF generation
        if (showNavbar && toggleNavbar) {
          toggleNavbar();
        }
        if (setEscapeOverflow) {
          setEscapeOverflow(true);
        }
        if (setIsViewMode) {
          setIsViewMode(true);
        }
        if (setIsExporting) {
          setIsExporting(true);
        }

        // Generate PDF attachment
        setEmailStatus({ type: 'info', message: 'Generating PDF attachment...' });
        const pdfBlob = await generateInvoicePDF(
          componentRef, 
          selectedTemplate, 
          invoice,
          (status) => setEmailStatus({ type: 'info', message: status })
        );
        const pdfFileName = generateInvoicePDFFilename(invoice);

        // Restore original state
        if (setEscapeOverflow) {
          setEscapeOverflow(false);
        }
        if (setIsViewMode) {
          setIsViewMode(originalViewMode);
        }
        if (setIsExporting) {
          setIsExporting(originalExporting);
        }
        if (originalNavbarState && toggleNavbar) {
          toggleNavbar();
        }

        // Format the email content with attachment note
        const emailData = formatInvoiceEmailWithAttachment(invoice, currentUser);
        
        // Send email with PDF attachment via Gmail API
        setEmailStatus({ type: 'info', message: 'Sending email with PDF attachment...' });
        const result = await sendGmailHtmlEmailWithAttachment({
          accessToken: token,
          emailData: {
            to: emailRecipient.trim(),
            subject: emailData.subject,
            htmlBody: emailData.htmlBody
          },
          pdfBlob: pdfBlob,
          pdfFileName: pdfFileName
        });

        if (result.id) {
          setEmailStatus({ 
            type: 'success', 
            message: 'Email with PDF attachment sent successfully!' 
          });
          // Auto-close modal after 2 seconds
          setTimeout(() => {
            onClose();
          }, 2000);
        } else {
          throw new Error('Failed to send email via Gmail');
        }
      } else {
        // Fallback to basic email without PDF attachment
        setEmailStatus({ type: 'info', message: 'Sending email without PDF attachment...' });
        
        // Format the basic email content
      const emailData = formatInvoiceEmail(invoice, currentUser);
      
      // Send email via Gmail API
      const result = await sendGmailHtmlEmail({
        accessToken: token,
        emailData: {
          to: emailRecipient.trim(),
          subject: emailData.subject,
          htmlBody: emailData.htmlBody
        }
      });

      if (result.id) {
        setEmailStatus({ 
          type: 'success', 
            message: 'Email sent successfully! Note: PDF attachment not available in this view.' 
        });
        // Auto-close modal after 2 seconds
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        throw new Error('Failed to send email via Gmail');
        }
      }
    } catch (error) {
      secureLogger.error('Gmail sending error:', error);
      
      // Restore original state on error
      if (setEscapeOverflow) {
        setEscapeOverflow(false);
      }
      if (setIsViewMode) {
        setIsViewMode(true);
      }
      if (setIsExporting) {
        setIsExporting(false);
      }
      
      // Fallback to mailto if Gmail fails
      setEmailStatus({ 
        type: 'warning', 
        message: 'Gmail sending failed. Opening your email client...' 
      });
      
      const emailData = formatInvoiceEmail(invoice, currentUser);
      const mailtoLink = `mailto:${emailRecipient.trim()}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.plainBody)}`;
      
      window.location.href = mailtoLink;
    } finally {
      setIsLoading(false);
    }
  };

  const handleWhatsAppShare = () => {
    const text = generateInvoiceText();
    const phoneFormatted = phoneNumber.replace(/\D/g, ''); // Remove non-digits
    
    let whatsappUrl;
    if (phoneFormatted) {
      whatsappUrl = `https://wa.me/${phoneFormatted}?text=${encodeURIComponent(text)}`;
    } else {
      whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    }
    
    window.open(whatsappUrl, '_blank');
  };

  if (!invoice) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Share Invoice</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Invoice Preview */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-gray-900 mb-2">Invoice Details</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p><span className="font-medium">Invoice:</span> {invoice.invoiceNo}</p>
            <p><span className="font-medium">Client:</span> {invoice.clientName}</p>
            <p><span className="font-medium">Amount:</span> ${invoice.totalAmount?.toLocaleString() || '0'}</p>
            <p><span className="font-medium">Status:</span> {invoice.statusName}</p>
          </div>
        </div>

        {/* Email Status */}
        {emailStatus.message && (
          <div className={`p-3 rounded-md mb-4 text-sm ${
            emailStatus.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : emailStatus.type === 'error'
              ? 'bg-red-50 text-red-800 border border-red-200'
              : emailStatus.type === 'info'
              ? 'bg-blue-50 text-blue-800 border border-blue-200'
              : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
          }`}>
            {emailStatus.message}
          </div>
        )}

        {/* Share via Email */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Share via Email
          </label>
          
          <div className="flex space-x-2">
            <input
              type="email"
              value={emailRecipient}
              onChange={(e) => setEmailRecipient(e.target.value)}
              placeholder={invoice?.clientDetail?.email ? "Client email (auto-filled)" : "Enter email address"}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
            <button
              onClick={handleEmailShare}
              disabled={!emailRecipient.trim() || isLoading || !hasGmailAccess}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span>{componentRef ? 'Send with PDF' : 'Send Email'}</span>
                </>
              )}
            </button>
          </div>
          {invoice?.clientDetail?.email && (
            <p className="text-xs text-gray-500 mt-1">
              Email auto-filled from client data. You can edit it if needed.
            </p>
          )}
          {hasGmailAccess ? (
            <div>
            <p className="text-xs text-green-600 mt-1 flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Connected to Gmail - Ready to send
            </p>
              {componentRef ? (
                <p className="text-xs text-blue-600 mt-1">
                  📎 PDF attachment will be included with the email
                </p>
              ) : (
                <p className="text-xs text-orange-600 mt-1">
                  ℹ️ Email only (PDF attachment requires invoice detail view)
                </p>
              )}
            </div>
          ) : checkingAccess ? (
            <p className="text-xs text-blue-600 mt-1 flex items-center">
              <span className="inline-block w-3 h-3 mr-1 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
              Checking Gmail access...
            </p>
          ) : (
            <div className="mt-1">
              <p className="text-xs text-orange-600 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Gmail access required - Sign in with Google for email permissions
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <button
                  onClick={refreshGmailAccess}
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                  disabled={checkingAccess}
                >
                  Check Gmail access
                </button>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500">
                  Go to Profile to re-authenticate with Gmail permissions
                </span>
              </div>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Email will be sent directly from your Gmail account{componentRef ? ' with PDF attached' : ''}.
          </p>
        </div>

        {/* Share via WhatsApp */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Share via WhatsApp
          </label>
          <div className="flex space-x-2">
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter phone number (optional)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            <button
              onClick={handleWhatsAppShare}
              className="bg-green-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-600 transition-colors flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.570-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.786"/>
              </svg>
              <span>Share</span>
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Phone number is optional. Leave empty to open WhatsApp contact picker.
          </p>
        </div>

        {/* Close Button */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ShareInvoice;
