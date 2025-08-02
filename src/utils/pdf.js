import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

/**
 * Generate PDF from invoice component reference
 * @param {Object} componentRef - React ref to the invoice component
 * @param {string} selectedTemplate - Template type (modern, formal, default)
 * @param {Object} invoiceForm - Invoice data for filename
 * @param {Function} onStatusUpdate - Callback for status updates (optional)
 * @returns {Promise<Blob>} PDF blob
 */
export async function generateInvoicePDF(componentRef, selectedTemplate, invoiceForm, onStatusUpdate = () => {}) {
  try {
    onStatusUpdate("Preparing fonts and capturing...");
    
    // Wait for fonts to be fully loaded
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
    
    // Add a small delay to ensure all stylesheets are processed
    await new Promise(resolve => setTimeout(resolve, 500));
    
    onStatusUpdate("Capturing invoice image...");
    
    // Capture using html2canvas with optimized settings for better rendering
    const canvas = await html2canvas(componentRef.current, {
      scale: 2, // High quality
      useCORS: true, // Allow cross-origin images
      allowTaint: true, // Allow tainted canvas for external resources
      backgroundColor: '#ffffff',
      logging: false,
      foreignObjectRendering: false, // Disable for better compatibility
      imageTimeout: 15000, // Longer timeout for external resources
      removeContainer: true,
      onclone: function(clonedDoc, element) {
        // Ensure all elements are visible
        element.style.transform = 'none';
        element.style.WebkitTransform = 'none';
        
        // Force Josefin Sans font loading in the cloned document
        const style = clonedDoc.createElement('style');
        style.textContent = `
          * {
            font-family: "Josefin Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
          }
        `;
        clonedDoc.head.appendChild(style);
        
        return element;
      }
    });
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    
    onStatusUpdate("Converting image to PDF...");
    
    // Create an image element to get dimensions
    const img = new Image();
    const pdfBlob = await new Promise((resolve, reject) => {
      img.onload = () => {
        try {
          // Create PDF with appropriate orientation based on template
          const getOrientation = (template) => {
            switch(template) {
              case 'modern':
              case 'formal':
                return 'portrait';
              case 'default':
              default:
                return 'landscape';
            }
          };
          
          const pdf = new jsPDF({
            orientation: getOrientation(selectedTemplate),
            unit: 'mm',
            format: 'a4'
          });
          
          // Calculate dimensions to fit image properly
          const pageWidth = pdf.internal.pageSize.getWidth(); // 297mm for landscape, 210mm for portrait A4
          const pageHeight = pdf.internal.pageSize.getHeight(); // 210mm for landscape, 297mm for portrait A4
          const margin = 10; // 10mm margin
          const availableWidth = pageWidth - (margin * 2);
          const availableHeight = pageHeight - (margin * 2);
          
          // Calculate scaling to maintain aspect ratio
          const imgAspectRatio = img.width / img.height;
          const pageAspectRatio = availableWidth / availableHeight;
          
          let finalWidth, finalHeight;
          
          if (imgAspectRatio > pageAspectRatio) {
            // Image is wider, scale by width
            finalWidth = availableWidth;
            finalHeight = availableWidth / imgAspectRatio;
          } else {
            // Image is taller, scale by height
            finalHeight = availableHeight;
            finalWidth = availableHeight * imgAspectRatio;
          }
          
          // Center horizontally, position at top with margin
          const x = (pageWidth - finalWidth) / 2;
          const y = margin; // Start from top margin, no centering vertically
          
          // Add image to PDF
          pdf.addImage(dataUrl, 'JPEG', x, y, finalWidth, finalHeight);
          
          // Convert to blob
          const pdfBlobResult = pdf.output('blob');
          resolve(pdfBlobResult);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load captured image'));
      };
      
      img.src = dataUrl;
    });
    
    onStatusUpdate("PDF generated successfully");
    return pdfBlob;
    
  } catch (error) {
    onStatusUpdate("PDF generation failed");
    throw new Error(`PDF generation failed: ${error.message}`);
  }
}

/**
 * Generate filename for invoice PDF
 * @param {Object} invoiceForm - Invoice data
 * @returns {string} Formatted filename
 */
export function generateInvoicePDFFilename(invoiceForm) {
  return `Invoice_${invoiceForm?.invoiceNo || new Date().getTime()}.pdf`;
}
