import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useReactToPrint } from "react-to-print";
import { useDispatch, useSelector } from "react-redux";
import NumberFormat from "react-number-format";
import { toast } from "react-toastify";
import InvoiceTopBar from "../../components/Invoice/InvoiceTopBar";
import useSubscriptionLimits from "../../hooks/useSubscriptionLimits";
import UsageLimitModal from "../../components/UsageRestriction/UsageLimitModal";
import {
  getAllInvoiceDetailSelector,
  getCurrentBGImage,
  getCurrentColor,
  getInvoiceNewForm,
  getIsConfirm,
  setConfirmModalOpen,
  setDefaultBackground,
  setDefaultColor,
  setIsConfirm,
  setNewInvoices,
  setSettingModalOpen,
  updateExisitingInvoiceForm,
  updateNewInvoiceForm,
} from "../../store/invoiceSlice";
import {
  getSelectedClient,
  setOpenClientSelector,
} from "../../store/clientSlice";
import { getCompanyData } from "../../store/companySlice";
import { defaultInputSmStyle, IconStyle } from "../../constants/defaultStyles";
import Button from "../../components/Button/Button";

import InvoiceIcon from "../../components/Icons/InvoiceIcon";
import PlusCircleIcon from "../../components/Icons/PlusCircleIcon";
import { nanoid } from "nanoid";
import DeleteIcon from "../../components/Icons/DeleteIcon";
import {
  getSelectedProduct,
  setOpenProductSelector,
} from "../../store/productSlice";
import { useAppContext } from "../../context/AppContext";
import TaxesIcon from "../../components/Icons/TaxesIcon";
import DollarIcon from "../../components/Icons/DollarIcon";
import CheckCircleIcon from "../../components/Icons/CheckCircleIcon";
import SecurityIcon from "../../components/Icons/SecurityIcon";
import {
  getTotalTaxesWithPercent,
  sumProductTotal,
  sumTotalAmount,
  sumTotalTaxes,
} from "../../utils/match";
import PageTitle from "../../components/Common/PageTitle";
import { uploadToGoogleDriveWithNestedFolder, generateInvoiceFolderPath } from "../../utils/googleDrive";
import domtoimage from "dom-to-image-more";
import { jsPDF } from "jspdf";
import { numberToWords } from "../../utils/numberToWords";

import ClientChooseModal from "../../components/Clients/ClientChooseModal";
import ProductChoosenModal from "../../components/Product/ProductChoosenModal";
import TemplateSelector from "../../components/Invoice/TemplateSelector";

import ModernTemplate from "../../components/Invoice/InvoiceTemplates/ModernTemplate";
import DefaultTemplate from "../../components/Invoice/InvoiceTemplates/DefaultTemplate";
import FormalTemplate from "../../components/Invoice/InvoiceTemplates/FormalTemplate";
import { sendGmailHtmlEmailWithAttachment, formatInvoiceEmailWithAttachment } from "../../utils/gmail";
import userService from "../../services/userService";
import secureLogger from "../../utils/secureLogger";
import { generateInvoicePDF, generateInvoicePDFFilename } from "../../utils/pdf";

function InvoiceDetailScreen(props) {
  const { initLoading, showNavbar, toggleNavbar, setEscapeOverflow } =
    useAppContext();
  const params = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Subscription limits hook
  const { 
    canCreateResource, 
    canExportFormat, 
    canUseFeature, 
    canUseTemplate,
    trackAction, 
    getCurrentPlan 
  } = useSubscriptionLimits();

  const componentRef = useRef(null);
  const reactToPrintContent = useCallback(() => {
    return componentRef.current;
  }, []);
  const handlePrint = useReactToPrint({
    content: reactToPrintContent,
    documentTitle: "Invoice Letter",
    onAfterPrint: useCallback(() => {
      setIsExporting(false);
      setEscapeOverflow(false);
    }, [setEscapeOverflow]),
    removeAfterPrint: true,
  });

  const invoiceNewForm = useSelector(getInvoiceNewForm);
  const allInvoiceDetails = useSelector(getAllInvoiceDetailSelector);
  const company = useSelector(getCompanyData);
  const selectedClient = useSelector(getSelectedClient);
  const selectedProduct = useSelector(getSelectedProduct);
  const currentBg = useSelector(getCurrentBGImage);
  const currentColor = useSelector(getCurrentColor);
  const isConfirm = useSelector(getIsConfirm);

  const [invoiceForm, setInvoiceForm] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('default');
  const [statusData, setStatusData] = useState({
    statusName: "Draft",
    statusIndex: 1,
  });
  
  // Subscription limits state
  const [showExportLimitModal, setShowExportLimitModal] = useState(false);
  const [showDriveExportLimitModal, setShowDriveExportLimitModal] = useState(false);
  const [showInvoiceLimitModal, setShowInvoiceLimitModal] = useState(false);
  const [showTemplateSaveLimitModal, setShowTemplateSaveLimitModal] = useState(false);
  
  // Google Drive integration state
  const [googleAuth, setGoogleAuth] = useState({ user: null, token: null });
  const [uploadStatus, setUploadStatus] = useState("");

  // Email sharing state
  const [emailRecipient, setEmailRecipient] = useState('');
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState({ type: '', message: '' });
  const [currentUser, setCurrentUser] = useState(null);

  // Listen for GoogleAuthDrive updates from App
  useEffect(() => {
    if (window.googleAuthDrive) {
      setGoogleAuth(window.googleAuthDrive);
    }
  }, []);

  // Get current user and pre-fill email when invoice changes
  useEffect(() => {
    const user = userService.getCurrentUser();
    setCurrentUser(user);
    
    // Pre-fill email with client's email when invoice changes
    if (invoiceForm?.clientDetail?.email) {
      setEmailRecipient(invoiceForm.clientDetail.email);
    } else {
      setEmailRecipient('');
    }
    // Reset status when invoice changes
    setEmailStatus({ type: '', message: '' });
  }, [invoiceForm]);

  // Email sharing function
  const handleEmailShare = async () => {
    // Check subscription limits before email sharing
    if (!canUseFeature('email_share')) {
      setEmailStatus({ type: 'error', message: 'Email sharing is not available on your current plan.' });
      return;
    }

    if (!emailRecipient.trim()) {
      setEmailStatus({ type: 'error', message: 'Please enter an email address' });
      return;
    }

    setIsEmailLoading(true);
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

      // Set export mode for PDF generation
      const originalNavbarState = showNavbar;
      const originalViewMode = isViewMode;
      const originalExporting = isExporting;
      
      if (showNavbar) {
        toggleNavbar();
      }
      setEscapeOverflow(true);
      setIsViewMode(true);
      setIsExporting(true);

      // Generate PDF attachment
      setEmailStatus({ type: 'info', message: 'Generating PDF attachment...' });
      const pdfBlob = await generateInvoicePDF(
        componentRef, 
        selectedTemplate, 
        invoiceForm,
        (status) => setEmailStatus({ type: 'info', message: status })
      );
      const pdfFileName = generateInvoicePDFFilename(invoiceForm);

      // Restore original state
      setEscapeOverflow(false);
      setIsViewMode(originalViewMode);
      setIsExporting(originalExporting);
      if (originalNavbarState) {
        toggleNavbar();
      }

      // Format the email content with attachment note
      const emailData = formatInvoiceEmailWithAttachment(invoiceForm, currentUser);
      
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
        
        // Track email share usage
        trackAction('email_shares', { 
          invoiceId: invoiceForm?.id || params.id,
          invoiceNo: invoiceForm?.invoiceNo,
          recipient: emailRecipient.trim(),
          template: selectedTemplate
        });
        
        // Clear status after 3 seconds
        setTimeout(() => {
          setEmailStatus({ type: '', message: '' });
        }, 3000);
      } else {
        throw new Error('Failed to send email via Gmail');
      }
    } catch (error) {
      secureLogger.error('Gmail sending error:', error);
      
      // Restore original state on error
      setEscapeOverflow(false);
      setIsViewMode(true);
      setIsExporting(false);
      
      // Show error message instead of fallback
      setEmailStatus({ 
        type: 'error', 
        message: `Failed to send email: ${error.message}. Please check your Gmail permissions and try again.` 
      });
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleExport = useCallback(async () => {
    try {
      // Check subscription limits before exporting (async)
      const canExport = await canExportFormat('pdf');
      if (!canExport) {
        setShowExportLimitModal(true);
        return;
      }

      // Check if user can use the current template for export
      if (!canUseTemplate(selectedTemplate)) {
        toast.error(`You cannot export with ${selectedTemplate.charAt(0).toUpperCase() + selectedTemplate.slice(1)} template. Please upgrade your plan or switch to Default template.`, {
          position: "bottom-center",
          autoClose: 4000,
        });
        return;
      }

      if (showNavbar) {
        toggleNavbar();
      }
      setEscapeOverflow(true);
      setIsViewMode(true);
      setIsExporting(true);
      
      // Set print orientation based on template
      const styleId = 'dynamic-print-style';
      let existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
      
      const getPrintStyle = (template) => {
        switch(template) {
          case 'modern':
            return '@page { size: A4 portrait; margin: 20mm; }';
          case 'formal':
            return '@page { size: A4 portrait; margin: 15mm; }';
          case 'default':
          default:
            return '@page { size: A4 landscape; margin: 15mm; }';
        }
      };
      
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = getPrintStyle(selectedTemplate);
      document.head.appendChild(style);
      
      // Track export immediately after limit check passes
      // This ensures we count the export attempt, not just successful prints
      await trackAction('invoice_exports', { 
        invoiceId: invoiceForm?.id || params.id,
        invoiceNo: invoiceForm?.invoiceNo,
        format: 'pdf',
        template: selectedTemplate
      });
      
      // Trigger print dialog
      setTimeout(() => {
        handlePrint();
        
        // Clean up the style after printing
        setTimeout(() => {
          const tempStyle = document.getElementById(styleId);
          if (tempStyle) {
            tempStyle.remove();
          }
        }, 1000);
      }, 100);
    } catch (error) {
      console.error('Error during export:', error);
      toast.error('An error occurred during export. Please try again.', {
        position: "bottom-center",
        autoClose: 3000,
      });
    }
  }, [
    setIsExporting,
    setEscapeOverflow,
    showNavbar,
    toggleNavbar,
    handlePrint,
    selectedTemplate,
    canExportFormat,
    canUseTemplate,
    trackAction,
    invoiceForm,
    params.id,
  ]);

  const toggleViewMode = useCallback(() => {
    if (invoiceForm.statusIndex !== "1" && isViewMode) {
      toast.warn("You can only edit on Draft Mode", {
        position: "bottom-center",
        autoClose: 3000,
      });
      return;
    }
    setIsViewMode((prev) => !prev);
  }, [invoiceForm, isViewMode]);

  const openSettingModal = useCallback(() => {
    if (invoiceForm.statusIndex !== "1" && isViewMode) {
      toast.warn("You can only change Setting on Draft Mode", {
        position: "bottom-center",
        autoClose: 3000,
      });
      return;
    }
    dispatch(setSettingModalOpen(true));
  }, [dispatch, invoiceForm, isViewMode]);

  const openChooseClient = useCallback(() => {
    dispatch(setOpenClientSelector(true));
  }, [dispatch]);

  const openChooseProduct = useCallback(() => {
    dispatch(setOpenProductSelector(true));
  }, [dispatch]);

  const addEmptyProduct = useCallback(() => {
    const emptyProduct = {
      id: nanoid(),
      name: "",
      productID: "",
      amount: 1,
      quantity: 1,
    };

    setInvoiceForm((prev) => {
      let updatedData = { ...prev };
      const updateProducts = [...prev.products, emptyProduct];
      const subTotalAmount = sumProductTotal(updateProducts);
      const updateTaxes = getTotalTaxesWithPercent(prev.taxes, subTotalAmount);
      updatedData.products = updateProducts;
      updatedData.taxes = updateTaxes;
      updatedData.totalAmount = sumTotalAmount(
        subTotalAmount,
        sumTotalTaxes(updateTaxes)
      );
      return updatedData;
    });
  }, []);

  const onDeleteProduct = useCallback((prodID) => {
    setInvoiceForm((prev) => {
      let updatedData = { ...prev };
      const updateProducts = prev.products.filter((prod) => prod.id !== prodID);
      const subTotalAmount = sumProductTotal(updateProducts);
      const updateTaxes = getTotalTaxesWithPercent(prev.taxes, subTotalAmount);
      updatedData.products = updateProducts;
      updatedData.taxes = updateTaxes;
      updatedData.totalAmount = sumTotalAmount(
        subTotalAmount,
        sumTotalTaxes(updateTaxes)
      );
      return updatedData;
    });
  }, []);

  const handlerInvoiceValue = useCallback((event, keyName) => {
    const value =
      typeof event === "string" ? new Date(event) : event?.target?.value;

    setInvoiceForm((prev) => {
      return { ...prev, [keyName]: value };
    });
  }, []);

  const handlerProductValue = useCallback(
    (event, keyName, productID) => {
      const value = event.target.value;

      // If Keyname Price or Quantity must be only number
      if (keyName === "quantity") {
        if (!`${value}`.match(/^\d+$/)) {
          return;
        }
      }

      if (keyName === "amount") {
        if (!`${value}`.match(/^[0-9]\d*(\.\d+)?$/)) {
          return;
        }
      }

      // Quantity Zero Case
      if ((keyName === "quantity" || keyName === "amount") && value <= 0) {
        return;
      }

      let updatedData = { ...invoiceForm };
      let updateProducts = [...invoiceForm.products];

      const isFindIndex = updateProducts.findIndex(
        (prod) => prod.id === productID
      );

      if (isFindIndex !== -1) {
        updateProducts[isFindIndex] = {
          ...updateProducts[isFindIndex],
          [keyName]: value,
        };

        updatedData.products = [...updateProducts];
      }

      if (keyName === "quantity" || keyName === "amount") {
        const subTotalAmount = sumProductTotal(updateProducts);
        const updateTaxes = getTotalTaxesWithPercent(
          invoiceForm.taxes,
          subTotalAmount
        );
        updatedData.taxes = updateTaxes;
        updatedData.totalAmount = sumTotalAmount(
          subTotalAmount,
          sumTotalTaxes(updateTaxes)
        );
      }
      setInvoiceForm(updatedData);
    },
    [invoiceForm]
  );

  const handlerTaxesValue = useCallback(
    (event, keyName, taxID) => {
      const value = event.target.value;
      let updateTaxes = [...invoiceForm.taxes];
      const isFindIndex = updateTaxes.findIndex((prod) => prod.id === taxID);
      if (isFindIndex === -1) {
        return;
      }
      const currentTax = updateTaxes[isFindIndex];

      if (currentTax.type === "percentage" && keyName === "value") {
        if (!`${value}`.match(/^[0-9]\d*(\.\d+)?$/)) {
          return;
        }

        if (value <= 0 || value > 100) {
          return;
        }
      }

      if (currentTax.type === "flat" && keyName === "value") {
        if (!`${value}`.match(/^[0-9]\d*(\.\d+)?$/)) {
          return;
        }

        if (value <= 0) {
          return;
        }
      }

      setInvoiceForm((prev) => {
        let taxes = [...prev.taxes];

        if (keyName === "value") {
          const subTotalAmount = sumProductTotal(prev.products);
          const amount = (value / 100) * subTotalAmount;
          taxes[isFindIndex] = {
            ...taxes[isFindIndex],
            [keyName]: value,
            amount: currentTax.type !== "percentage" ? value : amount,
          };
          const totalAmount = sumTotalAmount(
            subTotalAmount,
            sumTotalTaxes(taxes)
          );
          return { ...prev, taxes: taxes, totalAmount: totalAmount };
        } else {
          taxes[isFindIndex] = {
            ...taxes[isFindIndex],
            [keyName]: value,
          };
          return { ...prev, taxes: taxes };
        }
      });
    },
    [invoiceForm]
  );

  const handlerInvoiceClientValue = useCallback((event, keyName) => {
    const value =
      typeof event === "string" ? new Date(event) : event?.target?.value;

    setInvoiceForm((prev) => {
      return {
        ...prev,
        clientDetail: { ...prev.clientDetail, [keyName]: value },
      };
    });
  }, []);

  // Calculation for Showing
  const subTotal = useMemo(() => {
    if (!invoiceForm) {
      return 0;
    }

    if (!invoiceForm?.products) {
      return 0;
    }
    return sumProductTotal(invoiceForm.products);
  }, [invoiceForm]);

  const totalPercentTax = useMemo(() => {
    const isSomeTax = invoiceForm?.taxes?.some(
      (tax) => tax.type === "percentage"
    );

    if (!isSomeTax) {
      return 0;
    }

    const findIndex = invoiceForm?.taxes?.findIndex(
      (tax) => tax.type === "percentage"
    );

    return findIndex !== -1
      ? Number.isInteger(invoiceForm.taxes[findIndex].amount)
        ? invoiceForm.taxes[findIndex].amount
        : invoiceForm.taxes[findIndex].amount.toFixed(4).toString().slice(0, -2)
      : 0;
  }, [invoiceForm]);

  const addCGSTSGST = useCallback(() => {
    const hasCGST = invoiceForm.taxes.some(tax => tax.title === "CGST");
    const hasSGST = invoiceForm.taxes.some(tax => tax.title === "SGST");
    const hasIGST = invoiceForm.taxes.some(tax => tax.title === "IGST");

    if (hasCGST || hasSGST) {
      toast.error("CGST/SGST already added!", {
        position: "bottom-center",
        autoClose: 2000,
      });
      return;
    }

    if (hasIGST) {
      toast.error("Cannot add CGST/SGST when IGST is present. Please remove IGST first.", {
        position: "bottom-center",
        autoClose: 3000,
      });
      return;
    }

    setInvoiceForm((prev) => {
      const subTotalAmount = sumProductTotal(prev.products);
      const cgstAmount = (2.5 / 100) * subTotalAmount;
      const sgstAmount = (2.5 / 100) * subTotalAmount;
      
      const cgstTax = {
        id: nanoid(),
        title: "CGST",
        type: "percentage",
        value: 2.5,
        amount: cgstAmount,
      };
      
      const sgstTax = {
        id: nanoid(),
        title: "SGST",
        type: "percentage",
        value: 2.5,
        amount: sgstAmount,
      };
      
      const updateTaxes = [...prev.taxes, cgstTax, sgstTax];
      const totalAmount = sumTotalAmount(
        subTotalAmount,
        sumTotalTaxes(updateTaxes)
      );

      return {
        ...prev,
        taxes: updateTaxes,
        totalAmount: totalAmount,
      };
    });
  }, [invoiceForm]);

  const addIGST = useCallback(() => {
    const hasIGST = invoiceForm.taxes.some(tax => tax.title === "IGST");
    const hasCGST = invoiceForm.taxes.some(tax => tax.title === "CGST");
    const hasSGST = invoiceForm.taxes.some(tax => tax.title === "SGST");

    if (hasIGST) {
      toast.error("IGST already added!", {
        position: "bottom-center",
        autoClose: 2000,
      });
      return;
    }

    if (hasCGST || hasSGST) {
      toast.error("Cannot add IGST when CGST/SGST is present. Please remove CGST/SGST first.", {
        position: "bottom-center",
        autoClose: 3000,
      });
      return;
    }

    setInvoiceForm((prev) => {
      const subTotalAmount = sumProductTotal(prev.products);
      const igstAmount = (5 / 100) * subTotalAmount; // Default 5% but user can edit
      
      const igstTax = {
        id: nanoid(),
        title: "IGST",
        type: "percentage",
        value: 5, // Default 5% but editable
        amount: igstAmount,
      };
      
      const updateTaxes = [...prev.taxes, igstTax];
      const totalAmount = sumTotalAmount(
        subTotalAmount,
        sumTotalTaxes(updateTaxes)
      );

      return {
        ...prev,
        taxes: updateTaxes,
        totalAmount: totalAmount,
      };
    });
  }, [invoiceForm]);



  const addEmptyTax = useCallback(() => {
    setInvoiceForm((prev) => {
      const subTotalAmount = sumProductTotal(prev.products);
      const emptyTax = {
        id: nanoid(),
        title: "Extra Fees",
        type: "flat",
        value: 1,
        amount: 1,
      };
      const updateTaxes = [...prev.taxes, emptyTax];
      const totalAmount = sumTotalAmount(
        subTotalAmount,
        sumTotalTaxes(updateTaxes)
      );
      return { ...prev, taxes: updateTaxes, totalAmount };
    });
  }, []);

  const onDeleteTax = useCallback((taxID) => {
    setInvoiceForm((prev) => {
      const updateTaxes = prev.taxes.filter((prod) => prod.id !== taxID);
      let updatedData = { ...prev, taxes: updateTaxes };
      const subTotalAmount = sumProductTotal(prev.products);
      const totalAmount = sumTotalAmount(
        subTotalAmount,
        sumTotalTaxes(updateTaxes)
      );
      updatedData.totalAmount = totalAmount;
      return updatedData;
    });
  }, []);

  const saveAs = useCallback(
    async (status) => {
      try {
        // Check subscription limits before saving invoice (only for new invoices)
        if (params.id === "new") {
          const canCreate = await canCreateResource('invoices');
          if (!canCreate) {
            console.log('FREE PLAN: Invoice creation blocked - limit reached');
            setShowInvoiceLimitModal(true);
            return;
          }
        }

        // Check template restrictions for Free users
        const currentPlan = getCurrentPlan();
        if (currentPlan.id === 'free' && selectedTemplate !== 'default') {
          console.log('FREE PLAN: Template save blocked - only default template allowed');
          setShowTemplateSaveLimitModal(true);
          return;
        }

        console.log('FREE PLAN: Invoice save allowed');

        setStatusData({
          statusIndex: status === "Draft" ? "1" : status === "Unpaid" ? "2" : "3",
          statusName: status,
        });
        dispatch(setConfirmModalOpen(true));
      } catch (error) {
        console.error('Error checking invoice save permissions:', error);
        // Show error toast or modal
        toast.error('Unable to save invoice. Please try again.', {
          position: "bottom-center",
          autoClose: 3000,
        });
      }
    },
    [dispatch, params.id, canCreateResource, getCurrentPlan, selectedTemplate]
  );

  // Handler for when disabled save buttons are clicked - show appropriate modal
  const handleDisabledSaveClick = useCallback(async () => {
    try {
      if (params.id === "new") {
        const canCreate = await canCreateResource('invoices');
        if (!canCreate) {
          setShowInvoiceLimitModal(true);
          return;
        }
      }
      
      if (getCurrentPlan().id === 'free' && selectedTemplate !== 'default') {
        setShowTemplateSaveLimitModal(true);
      }
    } catch (error) {
      console.error('Error checking save permissions:', error);
      setShowInvoiceLimitModal(true); // Show limit modal as fallback
    }
  }, [params.id, canCreateResource, getCurrentPlan, selectedTemplate]);

  const goInvoiceList = useCallback(() => {
    navigate("/invoices");
  }, [navigate]);

  const handleGoogleDriveExport = useCallback(async () => {
    // Check subscription limits before Drive export
    if (!canUseFeature('export_drive')) {
      setShowDriveExportLimitModal(true);
      return;
    }

    const canExport = await canExportFormat('drive');
    if (!canExport) {
      setShowExportLimitModal(true);
      return;
    }

    // Check if user is authenticated
    if (!googleAuth.token) {
      toast.error("Please sign in to Google to upload invoice PDF to Drive");
      return;
    }

    // Generate automatic folder path based on creation date
    const automaticFolderPath = generateInvoiceFolderPath(invoiceForm.createdDate);
    const suggestedPath = automaticFolderPath.join('/');
    
    // Ask user if they want to use automatic folder structure or specify custom path
    const useAutomatic = window.confirm(
      `Do you want to save to the automatic folder structure?\n\n` +
      `Suggested path: ${suggestedPath}\n\n` +
      `Click "OK" to use automatic structure, or "Cancel" to specify custom folder path.`
    );
    
    let folderPath;
    
    if (useAutomatic) {
      folderPath = automaticFolderPath;
    } else {
      // Allow user to specify custom folder path
      const customPath = prompt(
        "Enter the folder path (separate nested folders with '/'):\n\n" +
        "Examples:\n" +
        "• invoices/2024/January\n" +
        "• custom/folder/structure\n" +
        "• leave empty for root folder"
      );
      
      // User cancelled the prompt
      if (customPath === null) {
        return;
      }
      
      if (customPath && customPath.trim()) {
        folderPath = customPath.trim().split('/').filter(folder => folder.trim());
      } else {
        folderPath = [];
      }
    }

    try {
      setUploadStatus("Preparing invoice image...");
      
      // Set export mode exactly like the working project
      if (showNavbar) {
        toggleNavbar();
      }
      setEscapeOverflow(true);
      setIsViewMode(true);
      setIsExporting(true);
      
      setUploadStatus("Capturing invoice image...");
      
      // Use dom-to-image exactly like the working project
      const dataUrl = await domtoimage.toJpeg(componentRef.current, { quality: 1 });
      
      setUploadStatus("Converting image to PDF...");
      
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
      
      setUploadStatus("Uploading PDF to Google Drive...");
      
      const fileName = `Invoice_${invoiceForm.invoiceNo || new Date().getTime()}.pdf`;
      
      const uploadRes = await uploadToGoogleDriveWithNestedFolder({
        accessToken: googleAuth.token,
        file: pdfBlob,
        fileName: fileName,
        folderPath: folderPath,
      });
      
      const folderPathDisplay = folderPath.length > 0 ? folderPath.join('/') : 'root folder';
      setUploadStatus(`✅ Successfully uploaded to Google Drive! File ID: ${uploadRes.id}`);
      toast.success(`Invoice PDF uploaded to Google Drive in: ${folderPathDisplay}`);
      
      // Track Drive export usage
      trackAction('invoice_exports', { 
        invoiceId: invoiceForm?.id || params.id,
        invoiceNo: invoiceForm?.invoiceNo,
        format: 'drive',
        template: selectedTemplate,
        driveFileId: uploadRes.id
      });
      
      // Clear status after 5 seconds
      setTimeout(() => {
        setUploadStatus("");
      }, 5000);
      
    } catch (error) {
      // Silent - Google Drive export errors should not expose details
      console.error('Error in Drive export:', error);
      const errorMessage = `Upload failed: ${error.message}`;
      setUploadStatus(`❌ ${errorMessage}`);
      toast.error(`Google Drive upload failed: ${error.message}`);
      
      // Clear error status after 5 seconds
      setTimeout(() => {
        setUploadStatus("");
      }, 5000);
    } finally {
      setIsExporting(false);
      setEscapeOverflow(false);
    }
  }, [
    googleAuth.token,
    invoiceForm,
    componentRef,
    showNavbar,
    toggleNavbar,
    setEscapeOverflow,
    selectedTemplate,
    canUseFeature,
    canExportFormat,
    trackAction,
    params.id,
  ]);



  useEffect(() => {
    if (selectedProduct !== null) {
      // If Choosen Exisiting Client And This form is news
      const { name, productID, amount } = selectedProduct;
      const newProduct = {
        id: nanoid(),
        name,
        productID,
        amount,
        quantity: 1,
      };

      setInvoiceForm((prev) => {
        let updatedData = { ...prev };
        const updateProducts = [...prev.products, newProduct];
        const subTotalAmount = sumProductTotal(updateProducts);
        const updateTaxes = getTotalTaxesWithPercent(
          prev.taxes,
          subTotalAmount
        );
        updatedData.products = updateProducts;
        updatedData.taxes = updateTaxes;
        updatedData.totalAmount = sumTotalAmount(
          subTotalAmount,
          sumTotalTaxes(updateTaxes)
        );
        return updatedData;
      });
    }
  }, [selectedProduct]);

  useEffect(() => {
    if (initLoading === false) {
      if (params.id === "new" && invoiceForm === null) {
        // If New I ignore Company Data,
        // Everytime we set current company Data
        setInvoiceForm({
          ...invoiceNewForm,
          companyDetail: { ...company },
          dueDate: new Date(invoiceNewForm.dueDate),
          createdDate: new Date(),
        });

        dispatch(setDefaultBackground(invoiceNewForm.backgroundImage));
        dispatch(setDefaultColor(invoiceNewForm.color));
      } else if (params.id !== "new" && invoiceForm === null) {
        // Else Exisiting Invoice,
        // We'll Set Company Data
        // But if it's Draft, we'll currenty set the data for Current Company Data
        // Because it's still Draft State
        const getInvoiceDetail = allInvoiceDetails.find(
          (inv) => inv.id === params.id
        );

        // If not Found Redirect Back
        // navigate("/");
        if (!getInvoiceDetail) {
          navigate("/invoices");
          return;
        } else {
          setInvoiceForm({
            ...getInvoiceDetail,
            companyDetail: { ...getInvoiceDetail.companyDetail },
            dueDate: new Date(getInvoiceDetail.dueDate),
            createdDate: new Date(getInvoiceDetail.createdDate),
          });

          dispatch(setDefaultBackground(getInvoiceDetail.backgroundImage));
          dispatch(setDefaultColor(getInvoiceDetail.color));
          setIsViewMode(true);
          
          // Set the template from saved invoice data
          if (getInvoiceDetail.template) {
            setSelectedTemplate(getInvoiceDetail.template);
          }
        }
      }
    }
  }, [
    params,
    invoiceForm,
    navigate,
    invoiceNewForm,
    initLoading,
    company,
    dispatch,
    allInvoiceDetails,
  ]);

  useEffect(() => {
    if (selectedClient !== null) {
      // If Choosen Exisiting Client And This form is news
      setInvoiceForm((prev) => {
        return {
          ...prev,
          clientDetail: { ...selectedClient },
        };
      });
    }
  }, [selectedClient]);

  useEffect(() => {
    // if (invoiceForm.produ)
    if (params.id === "new" && invoiceForm !== null) {
      dispatch(updateNewInvoiceForm({ ...invoiceForm, template: selectedTemplate }));
    } else if (params.id !== "new" && invoiceForm !== null) {
      dispatch(updateExisitingInvoiceForm({ ...invoiceForm, template: selectedTemplate }));
    }
  }, [dispatch, invoiceForm, params, selectedTemplate]);

  useEffect(() => {
    if (initLoading === false) {
      setInvoiceForm((prev) => ({
        ...prev,
        backgroundImage: currentBg,
        color: currentColor,
      }));
    }
  }, [currentBg, currentColor, initLoading]);

  // On Confirm Dependencies
  useEffect(() => {
    if (isConfirm) {
      const isNew = params.id === "new";
      if (isNew) {
        dispatch(setIsConfirm(false));
        dispatch(setNewInvoices({ ...invoiceForm, ...statusData, template: selectedTemplate }));
        
        // Track invoice creation for usage limits
        trackAction('invoices', { 
          invoiceId: invoiceForm?.id,
          invoiceNo: invoiceForm?.invoiceNo,
          status: statusData.statusName,
          template: selectedTemplate
        });
        
        setInvoiceForm({
          ...invoiceForm,
          products: [
            {
              amount: 1200,
              id: nanoid(),
              name: "productName",
              productID: "",
              quantity: 1,
            },
          ],
          taxes: [],
          totalAmount: 1200,
        });

        // Use window.location.href to trigger page refresh and auto sync
        setTimeout(() => {
          window.location.href = "/invoices";
        }, 300);
      } else {
        // Update Exisiting Invoice
        dispatch(setIsConfirm(false));
        setIsViewMode(true);
        setInvoiceForm({
          ...invoiceForm,
          ...statusData,
          template: selectedTemplate,
        });
        
        // Refresh page to trigger sync for existing invoice updates
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    }
  }, [dispatch, invoiceForm, isConfirm, navigate, params, statusData, selectedTemplate, trackAction]);

  return (
    <div>
      <div className="p-4">
        <PageTitle
          title={
            <>
              {params.id === "new"
                ? "New Invoice"
                : `Invoice Detail ${invoiceForm?.statusName}`}
            </>
          }
        />
      </div>
      <div className="px-4 pb-3">
        <InvoiceTopBar
          onClickBack={goInvoiceList}
          viewMode={isViewMode}
          onClickViewAs={toggleViewMode}
          onClickSetting={openSettingModal}
          onClickExport={handleExport}
          onClickGoogleDriveExport={handleGoogleDriveExport}
          isGoogleDriveUploading={uploadStatus.includes("Preparing") || uploadStatus.includes("Uploading")}
          googleAuthToken={googleAuth.token}
          selectedTemplate={selectedTemplate}
        />
        {/* Google Drive Status */}
        {uploadStatus && (
          <div className="mt-3">
            <div className={`text-sm p-3 rounded-xl ${
              uploadStatus.startsWith("❌") ? "bg-red-50 text-red-600 border border-red-200" : 
              uploadStatus.startsWith("✅") ? "bg-green-50 text-green-600 border border-green-200" : 
              "bg-blue-50 text-blue-600 border border-blue-200"
            }`}>
              {uploadStatus}
            </div>
          </div>
        )}
      </div>

      {/* Template Selector */}
      {invoiceForm && (
        <div className="px-4">
          <TemplateSelector
            currentTemplate={selectedTemplate}
            onTemplateChange={setSelectedTemplate}
            isViewMode={isViewMode}
          />
        </div>
      )}

      {invoiceForm && (
        <div
          className={
            selectedTemplate === 'formal'
              ? isExporting
                ? "bg-white mb-1 pt-1 px-1 border-2 border-black"
                : "bg-white mx-4 mb-1 border-2 border-gray-800"
              : isExporting
              ? "bg-white mb-1 pt-1 px-1 "
              : "bg-white mx-4 rounded-xl mb-1"
          }
          id="InvoiceWrapper"
          ref={componentRef}
          style={isExporting ? (
            selectedTemplate === 'formal' ? { width: '210mm', maxWidth: '210mm', padding: '10mm' } : 
            selectedTemplate === 'modern' ? { width: '210mm', maxWidth: '210mm', minHeight: '297mm' } : 
            { width: 1200 }
          ) : (
            selectedTemplate === 'formal' ? { width: '100%', maxWidth: '210mm', margin: '0 auto' } : 
            selectedTemplate === 'modern' ? { width: '100%', maxWidth: '210mm', margin: '0 auto' } : 
            {}
          )}
        >
          {/* Legacy formal template header removed - now handled by FormalTemplate.js */}
          {/* Background Image */}
          <div className={selectedTemplate === 'formal' ? 'w-full p-4 space-y-4' : ''}>
          {/* Legacy formal template company/invoice details removed - handled by FormalTemplate.js */}
          {           (selectedTemplate === 'modern' || selectedTemplate === 'default' || selectedTemplate === 'formal') ? null : (
          <div
            className={
              isExporting
                ? "py-5 px-8 bg-cover bg-center bg-slate-50 rounded-xl flex flex-row justify-between items-center"
                : "py-9 px-8 bg-cover bg-center bg-slate-50 rounded-xl flex flex-col sm:flex-row justify-between items-center"
            }
            style={{
              backgroundImage: `url(${invoiceForm?.backgroundImage?.base64})`,
            }}
          >
            <div
              className={
                isExporting
                  ? "flex xflex-row items-center"
                  : "flex flex-col sm:flex-row items-center"
              }
            >
              {invoiceForm?.companyDetail?.image ? (
                <img
                  className="object-contain h-20 w-20 mr-3 rounded"
                  alt={invoiceForm?.companyDetail?.companyName}
                  src={invoiceForm?.companyDetail?.image}
                />
              ) : (
                <span></span>
              )}

              <div
                className={
                  isExporting
                    ? "text-black font-title text-left"
                    : "text-black font-title text-center sm:text-left"
                }
              >
                <p className="font-bold mb-2">
                  {invoiceForm?.companyDetail?.companyName || "Company Name"}
                </p>
                <p className="text-sm font-medium">
                  {invoiceForm?.companyDetail?.billingAddress ||
                    "Plz add First Company Data"}
                </p>
                <p className="text-sm font-medium">
                  {invoiceForm?.companyDetail?.companyMobile || "Company Ph"}
                </p>
                <p className="text-sm font-medium">
                  {invoiceForm?.companyDetail?.companyEmail ||
                    "Company@email.com"}
                </p>
                <p className="text-sm font-medium">
                  GSTIN : {invoiceForm?.companyDetail?.companyGST ||
                    "Company GST Number"}
                </p>
                <p className="text-sm font-medium">
                  UDYAM : {invoiceForm?.companyDetail?.companyUDYAM ||
                    "Company UDYAM Number"}
                </p>
                <p className="text-sm font-medium">
                  SAC : {invoiceForm?.companyDetail?.companySAC ||
                    "Company SAC Number"}
                </p>
              </div>
            </div>
            <div className="text-black font-title font-bold text-5xl mt-5 sm:mt-0">
              Invoice
            </div>
          </div>
          )}
          {/* Background Image Finished */}
          {/* Legacy formal template billing info removed - now handled by FormalTemplate.js */}





          {/* Legacy formal template products section removed - now handled by FormalTemplate.js */}
          {false && (
            <div className="mb-6">
              <table className="w-full border-collapse border-2 border-black">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black px-2 py-2 text-left text-xs font-bold">SR.</th>
                    <th className="border border-black px-2 py-2 text-left text-xs font-bold">DESCRIPTION OF GOODS</th>
                    <th className="border border-black px-2 py-2 text-center text-xs font-bold">HSN/SAC</th>
                    <th className="border border-black px-2 py-2 text-center text-xs font-bold">QTY</th>
                    <th className="border border-black px-2 py-2 text-center text-xs font-bold">RATE</th>
                    <th className="border border-black px-2 py-2 text-center text-xs font-bold">AMOUNT</th>
                  {!isViewMode && (
                      <th className="border border-black px-2 py-2 text-center text-xs font-bold">ACTION</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {invoiceForm?.products?.map((product, index) => (
                    <tr key={index}>
                      <td className="border border-black px-2 py-2 text-xs text-center">{index + 1}</td>
                      <td className="border border-black px-2 py-2 text-xs">
                        <div className="font-medium">
                  {!isViewMode ? (
                            product.productID ? (
                    <input
                      autoComplete="nope"
                                value={product.name}
                                placeholder="Product Name"
                                className="w-full border-none p-0 text-xs font-medium focus:outline-none bg-transparent"
                                onChange={(e) => handlerProductValue(e, "name", product.id)}
                    />
                  ) : (
                              <textarea
                      autoComplete="nope"
                                value={product.name}
                                placeholder="Product Description (You can add detailed description here)"
                                className="w-full border-none p-0 text-xs font-medium focus:outline-none bg-transparent resize-none"
                                rows={2}
                                onChange={(e) => handlerProductValue(e, "name", product.id)}
                              />
                            )
                          ) : (
                            <span className="whitespace-pre-wrap">{product.name || "Product Name"}</span>
                  )}
                </div>
                      </td>
                      <td className="border border-black px-2 py-2 text-xs text-center">
                  {!isViewMode ? (
                    <input
                      autoComplete="nope"
                            value={product.hsn || ""}
                            placeholder="HSN/SAC"
                            className="w-full border-none p-0 text-xs text-center focus:outline-none bg-transparent"
                            onChange={(e) => handlerProductValue(e, "hsn", product.id)}
                    />
                  ) : (
                          product.hsn || "-"
                        )}
                      </td>
                      <td className="border border-black px-2 py-2 text-xs text-center">
                  {!isViewMode ? (
                    <input
                      autoComplete="nope"
                            value={product.quantity || 1}
                            type="number"
                            className="w-full border-none p-0 text-xs text-center focus:outline-none bg-transparent"
                            onChange={(e) => handlerProductValue(e, "quantity", product.id)}
                    />
                  ) : (
                          product.quantity || 1
                        )}
                      </td>
                      <td className="border border-black px-2 py-2 text-xs text-center">
                  {!isViewMode ? (
                    <input
                      autoComplete="nope"
                            value={product.amount || 0}
                            type="number"
                            className="w-full border-none p-0 text-xs text-center focus:outline-none bg-transparent"
                            onChange={(e) => handlerProductValue(e, "amount", product.id)}
                    />
                  ) : (
                          `₹${(product.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                        )}
                      </td>
                      <td className="border border-black px-2 py-2 text-xs text-center font-medium">
                        ₹{((product.quantity || 1) * (product.amount || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      {!isViewMode && (
                        <td className="border border-black px-2 py-2 text-xs text-center">
                          <button
                            onClick={() => onDeleteProduct(product.id)}
                            className="text-red-500 hover:text-red-700 focus:outline-none"
                          >
                            <DeleteIcon className="h-3 w-3" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {/* Empty rows to fill space */}
                  {Array.from({ length: Math.max(0, 3 - (invoiceForm.products?.length || 0)) }).map((_, index) => (
                    <tr key={`empty-${index}`}>
                      <td className="border border-black px-2 py-2 text-xs text-center">&nbsp;</td>
                      <td className="border border-black px-2 py-2 text-xs">&nbsp;</td>
                      <td className="border border-black px-2 py-2 text-xs text-center">&nbsp;</td>
                      <td className="border border-black px-2 py-2 text-xs text-center">&nbsp;</td>
                      <td className="border border-black px-2 py-2 text-xs text-center">&nbsp;</td>
                      <td className="border border-black px-2 py-2 text-xs text-center">&nbsp;</td>
                      {!isViewMode && (
                        <td className="border border-black px-2 py-2 text-xs text-center">&nbsp;</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {!isViewMode && (
                <div className="mt-3 flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <Button size="sm" block={1} onClick={addEmptyProduct}>
                      <PlusCircleIcon className="w-4 h-4" /> Add Empty Product
                    </Button>
                </div>
                  <div className="flex-1">
                    <Button size="sm" block={1} onClick={openChooseProduct}>
                      <InvoiceIcon className="w-4 h-4" /> Add Existing Product
                    </Button>
              </div>
                </div>
              )}
              </div>
          )}

          {/* Modern Template */}
          {selectedTemplate === 'modern' && (
            <ModernTemplate
              invoiceForm={invoiceForm}
              isViewMode={isViewMode}
              isExporting={isExporting}
              setInvoiceForm={setInvoiceForm}
              handlerInvoiceValue={handlerInvoiceValue}
              handlerInvoiceClientValue={handlerInvoiceClientValue}
              handlerProductValue={handlerProductValue}
              handlerTaxesValue={handlerTaxesValue}
              openChooseClient={openChooseClient}
              addEmptyProduct={addEmptyProduct}
              openChooseProduct={openChooseProduct}
              addCGSTSGST={addCGSTSGST}
              addIGST={addIGST}
              addEmptyTax={addEmptyTax}
              onDeleteProduct={onDeleteProduct}
              onDeleteTax={onDeleteTax}
              sumProductTotal={sumProductTotal}
            />
          )}

          {/* Default Template */}
          {selectedTemplate === 'default' && (
            <DefaultTemplate
              invoiceForm={invoiceForm}
              isViewMode={isViewMode}
              isExporting={isExporting}
              setInvoiceForm={setInvoiceForm}
              handlerInvoiceValue={handlerInvoiceValue}
              handlerInvoiceClientValue={handlerInvoiceClientValue}
              handlerProductValue={handlerProductValue}
              handlerTaxesValue={handlerTaxesValue}
              openChooseClient={openChooseClient}
              addEmptyProduct={addEmptyProduct}
              openChooseProduct={openChooseProduct}
              addCGSTSGST={addCGSTSGST}
              addIGST={addIGST}
              addEmptyTax={addEmptyTax}
              onDeleteProduct={onDeleteProduct}
              onDeleteTax={onDeleteTax}
              sumProductTotal={sumProductTotal}
            />
          )}

          {/* Formal Template */}
          {selectedTemplate === 'formal' && (
            <FormalTemplate
              invoiceForm={invoiceForm}
              isViewMode={isViewMode}
              isExporting={isExporting}
              setInvoiceForm={setInvoiceForm}
              handlerInvoiceValue={handlerInvoiceValue}
              handlerInvoiceClientValue={handlerInvoiceClientValue}
              handlerProductValue={handlerProductValue}
              handlerTaxesValue={handlerTaxesValue}
              openChooseClient={openChooseClient}
              addEmptyProduct={addEmptyProduct}
              openChooseProduct={openChooseProduct}
              addCGSTSGST={addCGSTSGST}
              addIGST={addIGST}
              addEmptyTax={addEmptyTax}
              onDeleteProduct={onDeleteProduct}
              onDeleteTax={onDeleteTax}
              sumProductTotal={sumProductTotal}
            />
          )}

          <div className={selectedTemplate === 'formal' || selectedTemplate === 'modern' || selectedTemplate === 'default' ? "hidden" : "py-2 px-4"}>
            <div
              className={
                isExporting
                  ? "flex rounded-lg w-full flex-row px-4 py-1 text-white"
                  : "hidden sm:flex rounded-lg invisible sm:visible w-full flex-col sm:flex-row px-4 py-2 text-white"
              }
              style={{ backgroundColor: invoiceForm.color }}
            >
              <div
                className={
                  "font-title " +
                  (isExporting
                    ? " text-sm w-1/4 text-right pr-10"
                    : " w-full sm:w-1/4 text-right sm:pr-10")
                }
              >
                <span className="inline-block">Description</span>
              </div>
              <div
                className={
                  "font-title " +
                  (isExporting
                    ? " text-sm  w-1/4 text-right pr-10"
                    : " w-full sm:w-1/4 text-right sm:pr-10")
                }
              >
                Price
              </div>
              <div
                className={
                  "font-title " +
                  (isExporting
                    ? " text-sm  w-1/4 text-right pr-10"
                    : " w-full sm:w-1/4 text-right sm:pr-10")
                }
              >
                Qty
              </div>
              <div
                className={
                  "font-title" +
                  (isExporting
                    ? " text-sm w-1/4 text-right pr-10"
                    : "  w-full sm:w-1/4 text-right sm:pr-10")
                }
              >
                Total
              </div>
            </div>

            {invoiceForm?.products?.map((product, index) => (
              <div
                key={`${index}_${product.id}`}
                className={
                  (isExporting
                    ? "flex flex-row rounded-lg w-full px-4 py-1 items-center relative text-sm"
                    : "flex flex-col sm:flex-row rounded-lg sm:visible w-full px-4 py-2 items-center relative") +
                  (index % 2 !== 0 ? " bg-gray-50 " : "")
                }
              >
                <div
                  className={
                    isExporting
                      ? "font-title w-1/4 text-right pr-8 flex flex-row block"
                      : "font-title w-full sm:w-1/4 text-right sm:pr-8 flex flex-row sm:block"
                  }
                >
                  {!isExporting && (
                    <span className="sm:hidden w-1/2 flex flex-row items-center">
                      Description
                    </span>
                  )}
                  <span
                    className={
                      isExporting
                        ? "inline-block w-full mb-0"
                        : "inline-block w-1/2 sm:w-full mb-1 sm:mb-0"
                    }
                  >
                    {!isViewMode ? (
                      // Use textarea for empty products (custom descriptions), input for existing products
                      product.productID ? (
                      <input
                        autoComplete="nope"
                        value={product.name}
                        placeholder="Product Name"
                        className={defaultInputSmStyle + " text-right"}
                        onChange={(e) =>
                          handlerProductValue(e, "name", product.id)
                        }
                      />
                    ) : (
                        <textarea
                          autoComplete="nope"
                          value={product.name}
                          placeholder="Product Description (You can add detailed description here)"
                          className={defaultInputSmStyle + " text-right resize-none h-20 py-2"}
                          rows={3}
                          onChange={(e) =>
                            handlerProductValue(e, "name", product.id)
                          }
                        />
                      )
                    ) : (
                      <span className="pr-3 whitespace-pre-wrap">{product.name}</span>
                    )}
                  </span>
                </div>
                <div
                  className={
                    isExporting
                      ? "font-title w-1/4 text-right pr-8 flex flex-row block"
                      : "font-title w-full sm:w-1/4 text-right sm:pr-8 flex flex-row sm:block"
                  }
                >
                  {!isExporting && (
                    <span className="sm:hidden w-1/2 flex flex-row items-center">
                      Price
                    </span>
                  )}
                  <span
                    className={
                      isExporting
                        ? "inline-block w-full mb-0"
                        : "inline-block w-1/2 sm:w-full mb-1 sm:mb-0"
                    }
                  >
                    {!isViewMode ? (
                      <input
                        autoComplete="nope"
                        value={product.amount}
                        placeholder="Price"
                        type={"number"}
                        className={defaultInputSmStyle + " text-right"}
                        onChange={(e) =>
                          handlerProductValue(e, "amount", product.id)
                        }
                      />
                    ) : (
                      <span className="pr-3">
                        <NumberFormat
                          value={product.amount}
                          className=""
                          displayType={"text"}
                          thousandSeparator={true}
                          renderText={(value, props) => (
                            <span {...props}>{value}</span>
                          )}
                        />
                      </span>
                    )}
                  </span>
                </div>
                <div
                  className={
                    isExporting
                      ? "font-title w-1/4 text-right pr-8 flex flex-row block"
                      : "font-title w-full sm:w-1/4 text-right sm:pr-8 flex flex-row sm:block"
                  }
                >
                  {!isExporting && (
                    <span className="sm:hidden w-1/2 flex flex-row items-center">
                      Quantity
                    </span>
                  )}
                  <span
                    className={
                      isExporting
                        ? "inline-block w-full mb-0"
                        : "inline-block w-1/2 sm:w-full mb-1 sm:mb-0"
                    }
                  >
                    {!isViewMode ? (
                      <input
                        autoComplete="nope"
                        value={product.quantity}
                        type={"number"}
                        placeholder="Quantity"
                        className={defaultInputSmStyle + " text-right"}
                        onChange={(e) =>
                          handlerProductValue(e, "quantity", product.id)
                        }
                      />
                    ) : (
                      <span className="pr-3">
                        <NumberFormat
                          value={product.quantity}
                          className=""
                          displayType={"text"}
                          thousandSeparator={true}
                          renderText={(value, props) => (
                            <span {...props}>{value}</span>
                          )}
                        />
                      </span>
                    )}
                  </span>
                </div>
                <div
                  className={
                    isExporting
                      ? "font-title w-1/4 text-right pr-9 flex flex-row `1block"
                      : "font-title w-full sm:w-1/4 text-right sm:pr-9 flex flex-row sm:block"
                  }
                >
                  {!isExporting && (
                    <span className="sm:hidden w-1/2 flex flex-row items-center">
                      Total
                    </span>
                  )}

                  <span
                    className={
                      isExporting
                        ? "inline-block w-full "
                        : "inline-block w-1/2 sm:w-full"
                    }
                  >
                    <NumberFormat
                      value={
                        Number.isInteger(product.quantity * product.amount)
                          ? product.quantity * product.amount
                          : (product.quantity * product.amount)
                              .toFixed(4)
                              .toString()
                              .slice(0, -2)
                      }
                      className=""
                      displayType={"text"}
                      thousandSeparator={true}
                      renderText={(value, props) => (
                        <span {...props}>{value}</span>
                      )}
                    />{" "}
                    {invoiceForm?.currencyUnit}
                  </span>
                </div>
                {!isViewMode && (
                  <div
                    className="w-full sm:w-10 sm:absolute sm:right-0"
                    onClick={() => onDeleteProduct(product.id)}
                  >
                    <div className="w-full text-red-500 font-title h-8 sm:h-8 sm:w-8 cursor-pointer rounded-2xl bg-red-200 mr-2 flex justify-center items-center">
                      <DeleteIcon className="h-4 w-4" style={IconStyle} />
                      <span className="block sm:hidden">Delete Product</span>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Add Product Actions */}
            {!isViewMode && (
              <div className="flex flex-col sm:flex-row rounded-lg sm:visible w-full px-4 py-2 items-center sm:justify-end">
                <div className="font-title w-full sm:w-1/4 text-right sm:pr-8 flex flex-row sm:block mb-1">
                  <Button size="sm" block={1} onClick={addEmptyProduct}>
                    <PlusCircleIcon style={IconStyle} className="h-5 w-5" />
                    Add Empty Product
                  </Button>
                </div>
                <div className="font-title w-full sm:w-1/4 text-right sm:pr-8 flex flex-row sm:block mb-1">
                  <Button size="sm" block={1} onClick={openChooseProduct}>
                    <InvoiceIcon style={IconStyle} className="w-5 h-5" />
                    Add Exisiting Product
                  </Button>
                </div>
              </div>
            )}
            {/* Add Product Actions Finished*/}

            {/* Subtotal Start */}
            <div
              className={
                isExporting
                  ? "flex flex-row rounded-lg w-full px-4 py-1 justify-end items-end relative text-sm"
                  : "flex flex-row sm:flex-row sm:justify-end rounded-lg sm:visible w-full px-4 py-1 items-center "
              }
            >
              <div
                className={
                  isExporting
                    ? "font-title w-1/4 text-right pr-9 flex flex-row block justify-end text-sm "
                    : "font-title w-1/2 sm:w-1/4 text-right sm:pr-8 flex flex-row sm:block mb-1 sm:mb-0"
                }
              >
                Subtotal
              </div>
              <div
                className={
                  isExporting
                    ? "font-title w-1/4 text-right pr-9 flex flex-row block justify-end text-sm "
                    : "font-title w-1/2 sm:w-1/4 text-right sm:pr-9 flex flex-row justify-end sm:block mb-1"
                }
              >
                <NumberFormat
                  value={subTotal}
                  className="inline-block"
                  displayType={"text"}
                  thousandSeparator={true}
                  renderText={(value, props) => (
                    <span {...props}>
                      {value} {invoiceForm?.currencyUnit}
                    </span>
                  )}
                />
              </div>
            </div>
            {/* Subtotal Finished */}

            {/* Taxes */}
            {invoiceForm?.taxes?.map((tax, index) => (
              <div
                key={`${index}_${tax.id}`}
                className={
                  isExporting
                    ? "flex flex-row justify-end rounded-lg w-full px-4 py-1 items-center relative"
                    : "flex flex-col sm:flex-row sm:justify-end rounded-lg sm:visible w-full px-4 py-1 items-center relative"
                }
              >
                <div
                  className={
                    isExporting
                      ? "font-title w-3/5 text-right pr-8 flex flex-row block"
                      : "font-title w-full sm:w-3/5 text-right sm:pr-8 flex flex-row sm:block"
                  }
                >
                  {!isExporting && (
                    <div className="sm:hidden w-1/3 flex flex-row items-center">
                      Tax Type
                    </div>
                  )}
                  <div
                    className={
                      isExporting
                        ? "w-full mb-0 flex flex-row items-center justify-end"
                        : "w-2/3 sm:w-full mb-1 sm:mb-0 flex flex-row items-center sm:justify-end"
                    }
                  >
                    <div
                      className={
                        isExporting ? "w-1/3 pr-1" : "w-1/2 sm:w-1/3 pr-1"
                      }
                    >
                      {!isViewMode && (
                        <input
                          autoComplete="nope"
                          value={tax.title}
                          type={"text"}
                          placeholder="Tax Title"
                          className={defaultInputSmStyle + " text-right"}
                          onChange={(e) =>
                            handlerTaxesValue(e, "title", tax.id)
                          }
                        />
                      )}
                    </div>
                    <div
                      className={
                        (isExporting
                          ? "w-1/3 relative flex flex-row items-center text-sm"
                          : "w-1/2 sm:w-1/3 relative flex flex-row items-center") +
                        (isViewMode ? " justify-end" : " pr-4")
                      }
                    >
                      {!isViewMode ? (
                        <>
                          <input
                            autoComplete="nope"
                            value={tax.value}
                            type={"number"}
                            placeholder="Percentage"
                            className={defaultInputSmStyle + " text-right"}
                            onChange={(e) =>
                              handlerTaxesValue(e, "value", tax.id)
                            }
                          />
                          <span className="ml-1">
                            {tax.type === "percentage"
                              ? "%"
                              : invoiceForm.currencyUnit}
                          </span>
                        </>
                      ) : (
                        <div className="text-right">{tax.title}</div>
                      )}
                    </div>
                  </div>
                </div>
                <div
                  className={
                    isExporting
                      ? "font-title w-1/4 text-right pr-9 flex flex-row text-sm"
                      : "font-title w-full sm:w-1/4 text-right sm:pr-9 flex flex-row sm:block"
                  }
                >
                  {!isExporting && (
                    <span className="sm:hidden w-1/2 flex flex-row items-center">
                      Amount
                    </span>
                  )}
                  <span
                    className={
                      isExporting
                        ? "inline-block w-full"
                        : "inline-block w-1/2 sm:w-full"
                    }
                  >
                    <>
                      <div className="w-full">
                        <NumberFormat
                          value={
                            tax.type === "percentage"
                              ? totalPercentTax
                              : tax.amount
                          }
                          className=""
                          displayType={"text"}
                          thousandSeparator={true}
                          renderText={(value, props) => (
                            <span {...props}>
                              {value} {invoiceForm?.currencyUnit}
                            </span>
                          )}
                        />
                      </div>
                    </>
                  </span>
                </div>
                {!isViewMode && (
                  <div
                    className="w-full sm:w-10 sm:absolute sm:right-0"
                    onClick={() => onDeleteTax(tax.id)}
                  >
                    <div className="w-full text-red-500 font-title h-8 sm:h-8 sm:w-8 cursor-pointer rounded-2xl bg-red-200 mr-2 flex justify-center items-center">
                      <DeleteIcon className="h-4 w-4" style={IconStyle} />
                      <span className="block sm:hidden">Delete Tax</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {/* Taxes Finished*/}

            {/* Add Tax Action */}
            {!isViewMode && (
              <div className="flex flex-col sm:flex-row rounded-lg sm:visible w-full px-4 py-2 items-center sm:justify-end">
                <div className="font-title w-full sm:w-1/4 text-right sm:pr-8 flex flex-row sm:block mb-1">
                  <Button size="sm" block={1} onClick={addCGSTSGST}>
                    <TaxesIcon style={IconStyle} className="h-5 w-5" />
                    CGST + SGST (2.5% each)
                  </Button>
                </div>
                <div className="font-title w-full sm:w-1/4 text-right sm:pr-8 flex flex-row sm:block mb-1">
                  <Button size="sm" block={1} onClick={addIGST}>
                    <TaxesIcon style={IconStyle} className="h-5 w-5" />
                    IGST (Editable %)
                  </Button>
                </div>
                <div className="font-title w-full sm:w-1/4 text-right sm:pr-8 flex flex-row sm:block mb-1">
                  <Button size="sm" block={1} onClick={addEmptyTax}>
                    <DollarIcon style={IconStyle} className="w-5 h-5" />
                    Add Extra Fee
                  </Button>
                </div>
              </div>
            )}
            {/* Add Tax Action Finished*/}

            {/* Legacy formal template tax & total section removed - now handled by FormalTemplate.js */}
            {false && (
              <div className="mb-4">
                <div className="flex justify-end">
                  <div className="w-1/3">
                    <div className="text-right space-y-1">
                      <div className="flex justify-between">
                        <span className="text-xs">Taxable Amount</span>
                        <span className="text-xs font-bold">₹{(sumProductTotal(invoiceForm?.products || [])).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                      </div>
                      {invoiceForm?.taxes?.map((tax, index) => (
                        <div key={index} className="flex justify-between">
                          <span className="text-xs">{tax.title} {tax.type === "percentage" ? `${tax.value}%` : ""}</span>
                          <span className="text-xs font-bold">₹{(tax.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                      <div className="flex justify-between border-t-2 border-black pt-1">
                        <span className="text-sm font-bold">Total</span>
                        <span className="text-sm font-bold">₹{(invoiceForm?.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Legacy formal template amount in words section removed - now handled by FormalTemplate.js */}
            {false && (
              <div className="mb-4">
                <div className="text-xs">
                  <strong>Total amount (in words):</strong> INR {numberToWords(invoiceForm?.totalAmount || 0)} Only.
                </div>
                <div className="text-xs mt-1">
                  <strong>Amount Payable:</strong> ₹{(invoiceForm?.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
              </div>
            )}

            {/* Legacy formal template bottom section removed - now handled by FormalTemplate.js */}
            {false && (
              <div className="flex justify-between mb-4 gap-4">
                <div className="w-2/3 space-y-4">
                  {/* Pay using UPI Section */}
                  <div className="flex gap-4">
                    <div className="w-24">
                      <div className="text-xs font-bold mb-1">Pay using UPI:</div>
                      <div className="w-20 h-20 border border-gray-300 flex items-center justify-center bg-gray-50">
                        <span className="text-xs text-gray-500">QR Code</span>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="text-xs font-bold mb-1">Bank Details:</div>
                      <div className="text-xs space-y-0.5">
                        <div>
                          <span className="font-medium">Bank:</span> {!isViewMode ? (
                            <input
                              autoComplete="nope"
                              placeholder="YES BANK"
                              className="border-none p-0 text-xs focus:outline-none bg-transparent ml-1"
                              value={invoiceForm?.companyDetail?.bankName || ""}
                              onChange={(e) => setInvoiceForm(prev => ({ ...prev, companyDetail: { ...prev.companyDetail, bankName: e.target.value } }))}
                            />
                          ) : (
                            invoiceForm?.companyDetail?.bankName || "YES BANK"
                          )}
                        </div>
                        <div>
                          <span className="font-medium">Account #:</span> {!isViewMode ? (
                            <input
                              autoComplete="nope"
                              placeholder="667999922224445"
                              className="border-none p-0 text-xs focus:outline-none bg-transparent ml-1"
                              value={invoiceForm?.companyDetail?.accountNumber || ""}
                              onChange={(e) => setInvoiceForm(prev => ({ ...prev, companyDetail: { ...prev.companyDetail, accountNumber: e.target.value } }))}
                            />
                          ) : (
                            invoiceForm?.companyDetail?.accountNumber || "667999922224445"
                          )}
                        </div>
                        <div>
                          <span className="font-medium">IFSC:</span> {!isViewMode ? (
                            <input
                              autoComplete="nope"
                              placeholder="YESBBIN4567"
                              className="border-none p-0 text-xs focus:outline-none bg-transparent ml-1"
                              value={invoiceForm?.companyDetail?.ifscCode || ""}
                              onChange={(e) => setInvoiceForm(prev => ({ ...prev, companyDetail: { ...prev.companyDetail, ifscCode: e.target.value } }))}
                            />
                          ) : (
                            invoiceForm?.companyDetail?.ifscCode || "YESBBIN4567"
                          )}
                        </div>
                        <div>
                          <span className="font-medium">Branch:</span> {!isViewMode ? (
                            <input
                              autoComplete="nope"
                              placeholder="Kodihalli"
                              className="border-none p-0 text-xs focus:outline-none bg-transparent ml-1"
                              value={invoiceForm?.companyDetail?.branch || ""}
                              onChange={(e) => setInvoiceForm(prev => ({ ...prev, companyDetail: { ...prev.companyDetail, branch: e.target.value } }))}
                            />
                          ) : (
                            invoiceForm?.companyDetail?.branch || "Kodihalli"
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes Section */}
                  <div>
                    <div className="text-xs font-bold mb-1">Notes:</div>
                    <div className="text-xs">
                      {!isViewMode ? (
                        <textarea
                          autoComplete="nope"
                          placeholder="Thank you for the Business"
                          className="w-full border-none p-0 text-xs focus:outline-none bg-transparent resize-none"
                          rows={1}
                          value={invoiceForm?.clientNote || ""}
                          onChange={(e) => handlerInvoiceValue(e, "clientNote")}
                        />
                      ) : (
                        invoiceForm?.clientNote || "Thank you for the Business"
                      )}
                    </div>
                  </div>

                  {/* Terms and Conditions */}
                  <div>
                    <div className="text-xs font-bold mb-1">Terms and Conditions:</div>
                    <div className="text-xs space-y-0.5">
                      {!isViewMode ? (
                        <textarea
                          autoComplete="nope"
                          placeholder="1. Goods once sold or purchased are not refundable or exchangeable.&#10;2. We are not the manufacturer, company will stand for warranty as per their terms and conditions.&#10;3. Interest @24% p.a. will be charged for unpaid bills beyond 15 days.&#10;4. Subject to local Jurisdiction."
                          className="w-full border-none p-0 text-xs focus:outline-none bg-transparent resize-none"
                          rows={4}
                          value={invoiceForm?.notes || ""}
                          onChange={(e) => handlerInvoiceValue(e, "notes")}
                        />
                      ) : (
                        <div>
                          {(invoiceForm?.notes || "1. Goods once sold or purchased are not refundable or exchangeable.\n2. We are not the manufacturer, company will stand for warranty as per their terms and conditions.\n3. Interest @24% p.a. will be charged for unpaid bills beyond 15 days.\n4. Subject to local Jurisdiction.").split('\n').map((line, index) => (
                            <div key={index}>{line}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Signature Section */}
                <div className="w-1/3">
                  <div className="text-right">
                    <div className="text-xs font-bold mb-2">For {invoiceForm?.companyDetail?.companyName || "Amazon"}</div>
                    <div className="flex flex-col items-end">
                      {invoiceForm?.companyDetail?.sealImage && (
                        <img
                          className="object-contain h-16 w-16 mb-2"
                          alt="Company Seal"
                          src={invoiceForm.companyDetail.sealImage}
                        />
                      )}
                      <div className="w-32 h-16 border border-dashed border-gray-400 mb-2 flex items-center justify-center">
                        <span className="text-xs text-gray-400">Signature</span>
                      </div>
                      <div className="text-xs">Authorized Signatory</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Subtotal Start */}
            <div
              className={
              selectedTemplate === 'formal' || selectedTemplate === 'modern' || selectedTemplate === 'default' ? "hidden" :
                isExporting
                  ? "flex flex-row justify-end w-full items-center text-white"
                  : "flex flex-row sm:flex-row sm:justify-end w-full items-center text-white"
              }
            >
              <div
                className={
                  isExporting
                    ? "w-1/2 px-4 py-1 flex flex-row rounded-lg items-center"
                    : "w-full sm:w-1/2 px-4 py-1 flex flex-row rounded-lg items-center"
                }
                style={{ backgroundColor: invoiceForm.color }}
              >
                <div
                  className={
                    isExporting
                      ? "font-title text-base w-1/2 text-right pr-9 flex flex-row block  justify-end items-center"
                      : "font-title text-lg w-1/2 text-right sm:pr-9 flex flex-row sm:block items-center"
                  }
                >
                  Total
                </div>
                <div
                  className={
                    isExporting
                      ? "font-title text-lg w-1/2 text-right pr-9 flex flex-row block  justify-end items-center"
                      : "font-title text-lg w-1/2 text-right sm:pr-9 flex flex-row justify-end sm:block items-center"
                  }
                >
                  <NumberFormat
                    value={invoiceForm?.totalAmount}
                    className=""
                    displayType={"text"}
                    thousandSeparator={true}
                    renderText={(value, props) => (
                      <span {...props}>
                        {value}{" "}
                        <span className={isExporting ? "text-sm" : "text-base"}>
                          {invoiceForm?.currencyUnit}
                        </span>
                      </span>
                    )}
                  />
                </div>
              </div>
            </div>
            {/* Subtotal Finished */}

            {/* Amount in Words */}
            <div
              className={
                selectedTemplate === 'formal' ? "hidden" :
                isExporting
                  ? "flex flex-row justify-end w-full items-start mt-2"
                  : "flex flex-row sm:flex-row sm:justify-end w-full items-start mt-2"
              }
            >
              <div
                className={
                  isExporting
                    ? "w-1/2 px-4 py-2 flex flex-col rounded-lg"
                    : "w-full sm:w-1/2 px-4 py-2 flex flex-col rounded-lg"
                }
                style={{ backgroundColor: "#f8f9fa", border: "1px solid #e9ecef" }}
              >
                <div
                  className={
                    isExporting
                      ? "font-title text-sm font-bold mb-1 text-gray-700"
                      : "font-title text-base font-bold mb-1 text-gray-700"
                  }
                >
                  Amount in words: {numberToWords(invoiceForm?.totalAmount || 0)}
                </div>
              </div>
            </div>
            {/* Amount in Words Finished */}

            {/* Bank Details + Signature Section */}
            <div
              className={
                selectedTemplate === 'formal' || selectedTemplate === 'default' ? "hidden" :
                isExporting
                  ? "flex flex-row w-full mt-4 gap-4"
                  : "flex flex-col sm:flex-row w-full mt-4 gap-4"
              }
            >
              {/* Left Column - Bank Details */}
              <div
                className={
                  isExporting
                    ? "w-1/2 flex flex-col gap-4"
                    : "w-full sm:w-1/2 flex flex-col gap-4"
                }
              >
                {/* Bank Details */}
                {(invoiceForm?.companyDetail?.bankName || 
                  invoiceForm?.companyDetail?.accountName || 
                  invoiceForm?.companyDetail?.accountNumber || 
                  invoiceForm?.companyDetail?.branchName || 
                  invoiceForm?.companyDetail?.ifscCode) && (
                  <div className="px-4 py-3">
                    <div
                      className={
                        isExporting
                          ? "font-title text-sm font-bold mb-2 text-gray-700"
                          : "font-title text-base font-bold mb-2 text-gray-700"
                      }
                    >
                      Bank Details:
                    </div>
                    <div
                      className={
                        isExporting
                          ? "text-xs text-gray-600 leading-relaxed"
                          : "text-sm text-gray-600 leading-relaxed"
                      }
                    >
                      {invoiceForm?.companyDetail?.accountName && (
                        <div>A/c Name : {invoiceForm.companyDetail.accountName}</div>
                      )}
                      {invoiceForm?.companyDetail?.accountNumber && (
                        <div>A/c Number: {invoiceForm.companyDetail.accountNumber}</div>
                      )}
                      {invoiceForm?.companyDetail?.bankName && (
                        <div>Bank Name: {invoiceForm.companyDetail.bankName}</div>
                      )}
                      {invoiceForm?.companyDetail?.branchName && (
                        <div>Branch: {invoiceForm.companyDetail.branchName}</div>
                      )}
                      {invoiceForm?.companyDetail?.ifscCode && (
                        <div>IFSC Code: {invoiceForm.companyDetail.ifscCode}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Company Name and Authorized Signature */}
              <div
                className={
                  isExporting
                    ? "w-1/2 flex flex-col justify-end items-end"
                    : "w-full sm:w-1/2 flex flex-col justify-end items-end"
                }
              >
                <div className="text-right px-4 py-3">
                  <div
                    className={
                      isExporting
                        ? "font-title text-sm font-bold mb-4 text-gray-700"
                        : "font-title text-base font-bold mb-4 text-gray-700"
                    }
                  >
                    For {invoiceForm?.companyDetail?.companyName || "COMPANY NAME"}
                  </div>
                  
                  {/* Authorized Signature with Seal */}
                  <div className="flex flex-col items-end">
                    {invoiceForm?.companyDetail?.sealImage && (
                      <img
                        className="object-contain h-16 w-16 mb-2 rounded"
                        alt="Company Seal"
                        src={invoiceForm.companyDetail.sealImage}
                      />
                    )}
                    <div
                      className={
                        isExporting
                          ? "text-xs text-gray-600 border-t border-gray-400 pt-1 mt-2"
                          : "text-sm text-gray-600 border-t border-gray-400 pt-1 mt-2"
                      }
                    >
                      Authorized Signature
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Bank Details + Signature Section Finished */}
          </div>
          {/* Products Finished */}
          </div>
        </div>
      )}

      {invoiceForm && invoiceForm?.statusIndex !== "3" && (
        <div className="px-4 pt-3">
          <div className="bg-white rounded-xl px-3 py-3">
            <div className="flex flex-col flex-wrap sm:flex-row">
              {params.id === "new" && (
                <div className="w-full flex-1 my-1 sm:my-1 md:my-0 px-1">
                  <Button
                    size="sm"
                    block={1}
                    secondary={1}
                    onClick={async () => {
                      if (params.id === "new") {
                        try {
                          const canCreate = await canCreateResource('invoices');
                          if (!canCreate || (getCurrentPlan().id === 'free' && selectedTemplate !== 'default')) {
                            await handleDisabledSaveClick();
                            return;
                          }
                        } catch (error) {
                          console.error('Error checking permissions:', error);
                          setShowInvoiceLimitModal(true);
                          return;
                        }
                      }
                      await saveAs("Draft");
                    }}
                    disabled={false}
                  >
                    <CheckCircleIcon className="h-5 w-5 mr-1" /> 
                    "Save As Draft"
                  </Button>
                </div>
              )}
              {invoiceForm?.statusIndex !== "2" && (
                <div className="w-full flex-1 my-1 sm:my-1 md:my-0 px-1">
                  <Button
                    size="sm"
                    block={1}
                    danger={1}
                    onClick={async () => {
                      if (params.id === "new") {
                        try {
                          const canCreate = await canCreateResource('invoices');
                          if (!canCreate || (getCurrentPlan().id === 'free' && selectedTemplate !== 'default')) {
                            await handleDisabledSaveClick();
                            return;
                          }
                        } catch (error) {
                          console.error('Error checking permissions:', error);
                          setShowInvoiceLimitModal(true);
                          return;
                        }
                      }
                      await saveAs("Unpaid");
                    }}
                    disabled={false}
                  >
                    <DollarIcon className="h-5 w-5 mr-1" />{" "}
                    {`${params.id === "new" ? "Save" : "Update"} As Unpaid`}
                  </Button>
                </div>
              )}
              <div className="w-full flex-1 my-1 sm:my-1 md:my-0 px-1">
                <Button
                  size="sm"
                  block={1}
                  success={1}
                  onClick={async () => {
                    if (params.id === "new") {
                      try {
                        const canCreate = await canCreateResource('invoices');
                        if (!canCreate || (getCurrentPlan().id === 'free' && selectedTemplate !== 'default')) {
                          await handleDisabledSaveClick();
                          return;
                        }
                      } catch (error) {
                        console.error('Error checking permissions:', error);
                        setShowInvoiceLimitModal(true);
                        return;
                      }
                    }
                    await saveAs("Paid");
                  }}
                  disabled={false}
                >
                  <SecurityIcon className="h-5 w-5 mr-1" />{" "}
                  {`${params.id === "new" ? "Save" : "Update"} As Paid`}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Sharing Section */}
      {invoiceForm && (
        <div className="px-4 pt-3">
          <div className="bg-white rounded-xl px-3 py-3">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Share Invoice</h3>
            
            {/* Email Status */}
            {emailStatus.message && (
              <div className={`p-3 rounded-md mb-4 text-sm ${
                emailStatus.type === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : emailStatus.type === 'error'
                  ? 'bg-red-50 text-red-800 border border-red-200'
                  : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
              }`}>
                {emailStatus.message}
              </div>
            )}

            {/* Email Input and Send */}
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="flex-1">
                <input
                  type="email"
                  value={emailRecipient}
                  onChange={(e) => setEmailRecipient(e.target.value)}
                  placeholder={invoiceForm?.clientDetail?.email ? "Client email (auto-filled)" : "Enter email address"}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  disabled={isEmailLoading}
                />
                {invoiceForm?.clientDetail?.email && (
                  <p className="text-xs text-gray-500 mt-1">
                    Email auto-filled from client data. You can edit it if needed.
                  </p>
                )}
              </div>
              <div className="flex-shrink-0">
                <button
                  onClick={handleEmailShare}
                  disabled={!canUseFeature('email_share') || !emailRecipient.trim() || isEmailLoading}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg transition-all duration-200 flex items-center justify-center min-w-[120px]"
                >
                  {isEmailLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      {!canUseFeature('email_share') ? 'Upgrade to Share' : 'Send'}
                    </>
                  )}
                </button>
              </div>
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              Email will be sent directly from your Gmail account with the invoice PDF attached.
            </p>
          </div>
        </div>
      )}



      <ClientChooseModal />
      <ProductChoosenModal />
      
      {/* Usage Limit Modals */}
      <UsageLimitModal
        isOpen={showExportLimitModal}
        onClose={() => setShowExportLimitModal(false)}
        onUpgrade={() => {
          setShowExportLimitModal(false);
          navigate('/subscription');
        }}
        resourceType="invoice_exports"
        message="You've reached your invoice export limit. Upgrade to export more invoices and grow your business!"
      />
      
      <UsageLimitModal
        isOpen={showDriveExportLimitModal}
        onClose={() => setShowDriveExportLimitModal(false)}
        onUpgrade={() => {
          setShowDriveExportLimitModal(false);
          navigate('/subscription');
        }}
        resourceType="invoice_exports"
        message="Drive export is not available on your current plan. Upgrade to Pro or Business to export invoices directly to Google Drive!"
      />
      
      <UsageLimitModal
        isOpen={showInvoiceLimitModal}
        onClose={() => setShowInvoiceLimitModal(false)}
        onUpgrade={() => {
          setShowInvoiceLimitModal(false);
          navigate('/subscription');
        }}
        resourceType="invoices"
        message="You've reached your invoice creation limit. Upgrade to create more invoices and grow your business!"
      />
      
      <UsageLimitModal
        isOpen={showTemplateSaveLimitModal}
        onClose={() => setShowTemplateSaveLimitModal(false)}
        onUpgrade={() => {
          setShowTemplateSaveLimitModal(false);
          navigate('/subscription');
        }}
        resourceType="templates"
        message="You can only save invoices with the Default template on the Free plan. Upgrade to save with all templates!"
      />
    </div>
  );
}

export default InvoiceDetailScreen;
