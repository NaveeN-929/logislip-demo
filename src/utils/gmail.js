// Gmail API utility functions
// Requires Google API access token with Gmail scope

/**
 * Send email using Gmail API
 * @param {string} accessToken - Google OAuth access token
 * @param {Object} emailData - Email data object
 * @param {string} emailData.to - Recipient email address
 * @param {string} emailData.subject - Email subject
 * @param {string} emailData.body - Email body (plain text)
 * @param {string} emailData.from - Sender email (optional, uses authenticated user's email)
 * @returns {Promise<Object>} Gmail API response
 */
export async function sendGmailEmail({ accessToken, emailData }) {
  const { to, subject, body, from } = emailData;
  
  // Create the email message in RFC 2822 format
  const emailContent = [
    `To: ${to}`,
    `Subject: ${subject}`,
    from ? `From: ${from}` : '',
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    body
  ].filter(Boolean).join('\n');

  // Base64 encode the email content
  const encodedEmail = btoa(unescape(encodeURIComponent(emailContent)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: encodedEmail
    })
  });

  if (!response.ok) {
    const error = await response.json();
    // Check for authentication errors and provide user-friendly messages
    if (response.status === 401 || (error.error?.message && error.error.message.includes('authentication'))) {
      throw new Error('Your Gmail session has expired. Please sign out and sign in again to send emails.');
    }
    throw new Error(`Gmail API error: ${error.error?.message || 'Unknown error'}`);
  }

  return await response.json();
}

/**
 * Send HTML email using Gmail API
 * @param {string} accessToken - Google OAuth access token
 * @param {Object} emailData - Email data object
 * @param {string} emailData.to - Recipient email address
 * @param {string} emailData.subject - Email subject
 * @param {string} emailData.htmlBody - Email body (HTML)
 * @param {string} emailData.from - Sender email (optional, uses authenticated user's email)
 * @returns {Promise<Object>} Gmail API response
 */
export async function sendGmailHtmlEmail({ accessToken, emailData }) {
  const { to, subject, htmlBody, from } = emailData;
  
  // Create the email message in RFC 2822 format with HTML content
  const emailContent = [
    `To: ${to}`,
    `Subject: ${subject}`,
    from ? `From: ${from}` : '',
    'Content-Type: text/html; charset="UTF-8"',
    'MIME-Version: 1.0',
    '',
    htmlBody
  ].filter(Boolean).join('\n');

  // Base64 encode the email content
  const encodedEmail = btoa(unescape(encodeURIComponent(emailContent)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: encodedEmail
    })
  });

  if (!response.ok) {
    const error = await response.json();
    // Check for authentication errors and provide user-friendly messages
    if (response.status === 401 || (error.error?.message && error.error.message.includes('authentication'))) {
      throw new Error('Your Gmail session has expired. Please sign out and sign in again to send emails.');
    }
    throw new Error(`Gmail API error: ${error.error?.message || 'Unknown error'}`);
  }

  return await response.json();
}

/**
 * Send HTML email with PDF attachment using Gmail API
 * @param {string} accessToken - Google OAuth access token
 * @param {Object} emailData - Email data object
 * @param {string} emailData.to - Recipient email address
 * @param {string} emailData.subject - Email subject
 * @param {string} emailData.htmlBody - Email body (HTML)
 * @param {Blob} pdfBlob - PDF file as blob
 * @param {string} pdfFileName - Name of the PDF file
 * @param {string} emailData.from - Sender email (optional, uses authenticated user's email)
 * @returns {Promise<Object>} Gmail API response
 */
export async function sendGmailHtmlEmailWithAttachment({ accessToken, emailData, pdfBlob, pdfFileName }) {
  const { to, subject, htmlBody, from } = emailData;
  
  // Convert PDF blob to base64
  const pdfBase64 = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]; // Remove data:application/pdf;base64, prefix
      resolve(base64);
    };
    reader.readAsDataURL(pdfBlob);
  });

  // Create multipart message with proper structure for Gmail API
  const boundary = 'boundary_' + Math.random().toString(36).substr(2, 15);
  
  // Create the email content with proper MIME structure
  let emailContent = '';
  
  // Headers
  emailContent += `To: ${to}\r\n`;
  emailContent += `Subject: ${subject}\r\n`;
  if (from) emailContent += `From: ${from}\r\n`;
  emailContent += 'MIME-Version: 1.0\r\n';
  emailContent += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n`;
  emailContent += '\r\n';
  
  // Body part (HTML)
  emailContent += `--${boundary}\r\n`;
  emailContent += 'Content-Type: text/html; charset=UTF-8\r\n';
  emailContent += 'Content-Transfer-Encoding: 7bit\r\n';
  emailContent += '\r\n';
  emailContent += htmlBody + '\r\n';
  emailContent += '\r\n';
  
  // Attachment part (PDF)
  emailContent += `--${boundary}\r\n`;
  emailContent += `Content-Type: application/pdf; name="${pdfFileName}"\r\n`;
  emailContent += `Content-Disposition: attachment; filename="${pdfFileName}"\r\n`;
  emailContent += 'Content-Transfer-Encoding: base64\r\n';
  emailContent += '\r\n';
  
  // Split base64 data into 76-character lines (RFC requirement)
  const chunkSize = 76;
  for (let i = 0; i < pdfBase64.length; i += chunkSize) {
    emailContent += pdfBase64.substr(i, chunkSize) + '\r\n';
  }
  
  emailContent += '\r\n';
  emailContent += `--${boundary}--\r\n`;

  // Base64 encode the email content
  const encodedEmail = btoa(unescape(encodeURIComponent(emailContent)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: encodedEmail
    })
  });

  if (!response.ok) {
    const error = await response.json();
    // Check for authentication errors and provide user-friendly messages
    if (response.status === 401 || (error.error?.message && error.error.message.includes('authentication'))) {
      throw new Error('Your Gmail session has expired. Please sign out and sign in again to send emails.');
    }
    throw new Error(`Gmail API error: ${error.error?.message || 'Unknown error'}`);
  }

  return await response.json();
}

/**
 * Get user's Gmail profile
 * @param {string} accessToken - Google OAuth access token
 * @returns {Promise<Object>} Gmail profile data
 */
export async function getGmailProfile({ accessToken }) {
  const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/profile', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    }
  });

  if (!response.ok) {
    const error = await response.json();
    // Check for authentication errors and provide user-friendly messages
    if (response.status === 401 || (error.error?.message && error.error.message.includes('authentication'))) {
      throw new Error('Your Gmail session has expired. Please sign out and sign in again to send emails.');
    }
    throw new Error(`Gmail API error: ${error.error?.message || 'Unknown error'}`);
  }

  return await response.json();
}

/**
 * Check if user has Gmail access
 * @param {string} accessToken - Google OAuth access token
 * @returns {Promise<boolean>} True if user has Gmail access
 */
export async function checkGmailAccess({ accessToken }) {
  try {
    const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/profile', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    if (response.ok) {
      return true;
    } else {
      const error = await response.json();
      // Silent - Gmail API errors should not expose sensitive information
      if (error.status === 403) {
        if (error.error?.message?.includes('API_NOT_ENABLED')) {
          // Gmail API not enabled
          return false;
        } else if (error.error?.message?.includes('INSUFFICIENT_SCOPES')) {
          // Token missing Gmail permissions
          return false;
        } else {
          // Other 403 errors
          return false;
        }
      } else if (error.status === 401) {
        // Unauthorized - token expired or invalid
        return false;
      } else {
        // Other errors
        return false;
      }
    }
  } catch (error) {
    // Silent - Gmail API errors should not expose sensitive information
    if (error.status === 403) {
      if (error.error?.message?.includes('API_NOT_ENABLED')) {
        // Gmail API not enabled
        return false;
      } else if (error.error?.message?.includes('INSUFFICIENT_SCOPES')) {
        // Token missing Gmail permissions
        return false;
      } else {
        // Other 403 errors
        return false;
      }
    } else if (error.status === 401) {
      // Unauthorized - token expired or invalid
      return false;
    } else {
      // Other errors
    return false;
    }
  }
}

/**
 * Format invoice data for email
 * @param {Object} invoice - Invoice data
 * @param {Object} user - Current user data
 * @returns {Object} Formatted email data
 */
export function formatInvoiceEmail(invoice, user) {
  const subject = `Invoice ${invoice.invoiceNo} from ${user?.name || 'Logislip'}`;
  
  const plainBody = `Invoice: ${invoice.invoiceNo}
Client: ${invoice.clientDetail?.name || invoice.clientName || 'Valued Customer'}
Amount: ${invoice.currencyUnit || '₹'}${invoice.totalAmount?.toLocaleString() || '0'}
Status: ${invoice.statusName}

View invoice details at: ${window.location.origin}/invoices/${invoice.id}

Best regards,
${user?.name || 'Logislip Team'}`;

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #333; margin: 0 0 10px 0;">Invoice Details</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #555;">Invoice:</td>
            <td style="padding: 8px 0; color: #333;">${invoice.invoiceNo}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #555;">Client:</td>
            <td style="padding: 8px 0; color: #333;">${invoice.clientDetail?.name || invoice.clientName || 'Valued Customer'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #555;">Amount:</td>
            <td style="padding: 8px 0; color: #333; font-weight: bold; font-size: 18px;">${invoice.currencyUnit || '₹'}${invoice.totalAmount?.toLocaleString() || '0'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #555;">Status:</td>
            <td style="padding: 8px 0; color: #333;">${invoice.statusName}</td>
          </tr>
        </table>
      </div>
      
      <div style="text-align: center; margin: 20px 0;">
        <a href="${window.location.origin}/invoices/${invoice.id}" 
           style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          View Invoice Details
        </a>
      </div>
      
      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; color: #666;">
        <p>Best regards,<br>
        <strong>${user?.name || 'Logislip Team'}</strong></p>
      </div>
    </div>
  `;

  return {
    subject,
    plainBody,
    htmlBody
  };
}

/**
 * Format invoice data for email with PDF attachment (updated text)
 * @param {Object} invoice - Invoice data
 * @param {Object} user - Current user data
 * @returns {Object} Formatted email data
 */
export function formatInvoiceEmailWithAttachment(invoice, user) {
  const subject = `Invoice ${invoice.invoiceNo} from ${user?.name || 'Logislip'}`;
  
  const dueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Upon receipt';
  const companyName = invoice?.companyDetail?.companyName || user?.company || 'Logislip';
  
  const plainBody = `Dear ${invoice.clientDetail?.name || invoice.clientName || 'Valued Customer'},

I hope this email finds you well. Please find attached Invoice ${invoice.invoiceNo} for the services provided.

Invoice Details:
• Invoice Number: ${invoice.invoiceNo}
• Date: ${new Date(invoice.createdDate || Date.now()).toLocaleDateString()}
• Amount Due: ${invoice.currencyUnit || '₹'}${invoice.totalAmount?.toLocaleString() || '0'}
• Due Date: ${dueDate}
• Status: ${invoice.statusName}

Please review the attached PDF invoice for complete details of all items and services. If you have any questions regarding this invoice or need any clarification, please don't hesitate to contact me.

Payment can be made according to the terms specified in the invoice. We appreciate your prompt attention to this matter.

Thank you for your business and continued partnership.

Best regards,
${user?.name || 'Logislip Team'}
${companyName}

---
This email was sent via Logislip Invoice Management System`;

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <!-- Header -->
      <div style="background-color: #4a90e2; padding: 20px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px;">Invoice Notification</h1>
        <p style="margin: 5px 0 0 0;">Invoice ${invoice.invoiceNo}</p>
      </div>
      
      <!-- Greeting -->
      <div style="padding: 20px; background-color: #ffffff;">
        <p style="margin: 0 0 15px 0;">Dear <strong>${invoice.clientDetail?.name || invoice.clientName || 'Valued Customer'}</strong>,</p>
        <p style="margin: 0 0 15px 0;">I hope this email finds you well. Please find attached Invoice ${invoice.invoiceNo} for the services provided.</p>
      </div>

      <!-- Invoice Details -->
      <div style="padding: 20px; background-color: #f8f9fa;">
        <h2 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">Invoice Details</h2>
        <table style="width: 100%; border-collapse: collapse; background: white;">
          <tr style="background-color: #f1f3f4;">
            <td style="padding: 10px; font-weight: bold; border: 1px solid #ddd;">Invoice Number:</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${invoice.invoiceNo}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold; border: 1px solid #ddd;">Date:</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${new Date(invoice.createdDate || Date.now()).toLocaleDateString()}</td>
          </tr>
          <tr style="background-color: #f1f3f4;">
            <td style="padding: 10px; font-weight: bold; border: 1px solid #ddd;">Amount Due:</td>
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; color: #27ae60; font-size: 16px;">${invoice.currencyUnit || '₹'}${invoice.totalAmount?.toLocaleString() || '0'}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold; border: 1px solid #ddd;">Due Date:</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${dueDate}</td>
          </tr>
          <tr style="background-color: #f1f3f4;">
            <td style="padding: 10px; font-weight: bold; border: 1px solid #ddd;">Status:</td>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>${invoice.statusName}</strong></td>
          </tr>
        </table>
      </div>
      
      <!-- PDF Attachment Notice -->
      <div style="padding: 15px; background-color: #e3f2fd; text-align: center; border-left: 4px solid #2196f3;">
        <p style="margin: 0; color: #1565c0; font-weight: bold;">📎 Complete Invoice PDF Attached</p>
        <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">The detailed PDF invoice is attached to this email for your records.</p>
      </div>
      
      <!-- Payment Instructions -->
      <div style="padding: 20px; background-color: #ffffff;">
        <h3 style="margin: 0 0 10px 0; color: #333;">Payment Instructions</h3>
        <p style="margin: 0 0 10px 0;">Please review the attached PDF invoice for complete details of all items and services. Payment can be made according to the terms specified in the invoice.</p>
        <p style="margin: 0 0 15px 0;">If you have any questions regarding this invoice or need any clarification, please don't hesitate to contact me. We appreciate your prompt attention to this matter.</p>
      </div>
      
      <!-- Footer -->
      <div style="padding: 20px; background-color: #2c3e50; color: white; text-align: center;">
        <p style="margin: 0 0 10px 0;">Thank you for your business and continued partnership.</p>
        <p style="margin: 0 0 10px 0;"><strong>${user?.name || 'Logislip Team'}</strong><br>${companyName}</p>
        <p style="margin: 0; font-size: 12px; color: #bdc3c7;">This email was sent via Logislip Invoice Management System</p>
      </div>
    </div>
  `;

  return {
    subject,
    plainBody,
    htmlBody
  };
}
