import { createSlice, nanoid } from "@reduxjs/toolkit";
import localforage from "localforage";
import imageData from "../shared/imageData.json";
import colorData from "../shared/colorData.json";
import { sanitizeDataForStorage } from "../utils/storage";
import secureLogger from '../utils/secureLogger';
import subscriptionService from "../services/subscriptionService";
import userService from "../services/userService";
import {
  INVOICES_KEY,
  DEFAULT_INVOICE_COLOR,
  DEFAULT_INVOICE_BG,
  INVOICE_DETAILS,
  INVOICE_FORM_KEY,
} from "../constants/localKeys";

const initialState = {
  isConfirmModal: false,
  isConfirm: false,
  settingOpen: false,
  defaultColor: colorData[0],
  defaultBgImage: imageData[0],
  colors: colorData,
  images: imageData,
  data: [],
  detailList: [],
  deletedID: null,
  currentEditedID: null,
  newForm: {
    id: nanoid(),
    invoiceNo: "",
    statusIndex: "1",
    statusName: "Draft",
    totalAmount: 1200,
    color: colorData[0],
    backgroundImage: imageData[0],
    dueDate: new Date(),
    createdDate: new Date(),
    currencyUnit: "₹",
    clientDetail: {
      id: "",
      name: "",
      mobileNo: "",
      email: "",
      image: "",
      billingAddress: "",
    },
    products: [
      {
        amount: 1200,
        id: "D9vPlvwg11cxYJToEf3x4",
        name: "productName",
        productID: "",
        quantity: 1,
      },
    ],
    taxes: [],
  },
};

export const invoiceSlice = createSlice({
  name: "invoices",
  initialState,
  reducers: {
    setAllInvoice: (state, action) => {
      let invoiceData = action.payload || [];
      
      // Apply subscription limits to existing data
      const user = userService.getCurrentUser();
      if (user) {
        const plans = subscriptionService.getSubscriptionPlans();
        const currentPlan = plans[user.subscription_tier] || plans.free;
        const invoiceLimit = currentPlan.limitations.invoicesSaveExport;
        
        // If user has a limit and data exceeds it, truncate the data
        if (invoiceLimit !== -1 && invoiceData.length > invoiceLimit) {
          console.log(`INVOICE LIMIT ENFORCEMENT: Truncating ${invoiceData.length} invoices to ${invoiceLimit} for ${currentPlan.name} plan`);
          invoiceData = invoiceData.slice(0, invoiceLimit);
        }
      }
      
      state.data = [...invoiceData];
    },

    setAllInvoiceDetailList: (state, action) => {
      let invoiceDetailData = action.payload || [];
      
      // Apply subscription limits to existing data
      const user = userService.getCurrentUser();
      if (user) {
        const plans = subscriptionService.getSubscriptionPlans();
        const currentPlan = plans[user.subscription_tier] || plans.free;
        const invoiceLimit = currentPlan.limitations.invoicesSaveExport;
        
        // If user has a limit and data exceeds it, truncate the data
        if (invoiceLimit !== -1 && invoiceDetailData.length > invoiceLimit) {
          console.log(`INVOICE DETAIL LIMIT ENFORCEMENT: Truncating ${invoiceDetailData.length} invoice details to ${invoiceLimit} for ${currentPlan.name} plan`);
          invoiceDetailData = invoiceDetailData.slice(0, invoiceLimit);
        }
      }
      
      state.detailList = [...invoiceDetailData];
    },

    setNewInvoices: (state, action) => {
      const user = userService.getCurrentUser();
      if (!user) {
        console.log('INVOICE CREATION BLOCKED: No user found');
        return;
      }
      
      // Note: Subscription limits are checked in the UI layer using canCreateResource()
      // which gets real-time counts from Supabase, similar to how exports work
      // No need for a Redux-level check against local state that could be stale
      
      const { payload } = action;

      const id = nanoid();

      const {
        invoiceNo,
        statusIndex,
        statusName,
        totalAmount,
        dueDate,
        createdDate,
        clientDetail,
      } = payload;

      const newInvoice = {
        id,
        invoiceNo,
        statusIndex,
        statusName,
        totalAmount,
        dueDate,
        createdDate,
        clientName: clientDetail?.name,
      };

      const updateState = [...state.data, newInvoice];
      state.data = updateState;
      localforage.setItem(INVOICES_KEY, sanitizeDataForStorage(updateState));

      const newDetailList = [...state.detailList, { ...payload, id }];
      state.detailList = newDetailList;
      localforage.setItem(INVOICE_DETAILS, sanitizeDataForStorage(newDetailList));

      // Increment usage count in Supabase
      console.log(`📝 Attempting to increment invoices count for ID: ${id}`);
      userService.incrementResourceUsage('invoices', id)
        .then((result) => {
          console.log('✅ Invoice usage count incremented in Supabase:', result);
        })
        .catch(error => {
          console.error('❌ Failed to increment invoice usage count:', error);
        });
    },

    setDefaultColor: (state, action) => {
      const newColor = action.payload;
      state.defaultColor = newColor;
      localforage.setItem(DEFAULT_INVOICE_COLOR, sanitizeDataForStorage(newColor));
    },

    setDefaultBackground: (state, action) => {
      const newBackground = action.payload;
      state.defaultBgImage = newBackground;
      localforage.setItem(DEFAULT_INVOICE_BG, sanitizeDataForStorage(newBackground));
    },

    setDeleteId: (state, action) => {
      state.deletedID = action.payload;
    },

    setEditedId: (state, action) => {
      state.currentEditedID = action.payload;
    },

    onConfirmDeletedInvoice: (state, action) => {
      const deletedInvoice = state.data.find(invoice => invoice.id === state.deletedID);
      const newDatas = state.data.filter(
        (invoice) => invoice.id !== state.deletedID
      );
      state.data = newDatas;

      const newDetails = state.detailList.filter(
        (invoice) => invoice.id !== state.deletedID
      );
      state.detailList = newDetails;

      state.deletedID = null;
      localforage.setItem(INVOICES_KEY, sanitizeDataForStorage(newDatas));
      localforage.setItem(INVOICE_DETAILS, sanitizeDataForStorage(newDetails));

      // Decrement usage count in Supabase
      if (deletedInvoice) {
        userService.decrementResourceUsage('invoices', deletedInvoice.id)
          .then(() => {
            console.log('Invoice usage count decremented in Supabase');
          })
          .catch(error => {
            console.error('Failed to decrement invoice usage count:', error);
          });
      }
    },

    onConfirmEditInvoice: (state, action) => {
      const isFindIndex = state.data.findIndex(
        (product) => product.id === state.currentEditedID
      );
      if (isFindIndex !== -1) {
        state.data[isFindIndex] = { ...action.payload };
      }
      state.currentEditedID = null;
      localforage.setItem(INVOICES_KEY, sanitizeDataForStorage([...state.data]));
    },

    updateNewInvoiceFormField: (state, action) => {
      state.newForm[action.payload.key] = action.payload.value;
      const newForm = { ...state.newForm };
      localforage.setItem(
        INVOICE_FORM_KEY,
        sanitizeDataForStorage(JSON.parse(JSON.stringify(newForm)))
      );
    },

    updateNewInvoiceForm: (state, action) => {
      state.newForm = { ...action.payload };
      localforage.setItem(INVOICE_FORM_KEY, sanitizeDataForStorage({ ...state.newForm }));
    },

    updateExisitingInvoiceForm: (state, action) => {
      const {
        id,
        invoiceNo,
        statusIndex,
        statusName,
        totalAmount,
        dueDate,
        createdDate,
        clientDetail,
      } = action.payload;

      const findIndexOfList = state.data.findIndex(
        (product) => product.id === id
      );

      const newInvoice = {
        id,
        invoiceNo,
        statusIndex,
        statusName,
        totalAmount,
        dueDate,
        createdDate,
        clientName: clientDetail?.name,
      };

      if (findIndexOfList !== -1) {
        state.data[findIndexOfList] = { ...newInvoice };
      }
      const findIndexOfDetail = state.detailList.findIndex(
        (product) => product.id === id
      );

      if (findIndexOfDetail !== -1) {
        state.detailList[findIndexOfDetail] = { ...action.payload };
      }

      localforage.setItem(INVOICES_KEY, sanitizeDataForStorage([...state.data]));
      localforage.setItem(INVOICE_DETAILS, sanitizeDataForStorage([...state.detailList]));
    },

    setSettingModalOpen: (state, action) => {
      state.settingOpen = action.payload;
    },

    setConfirmModalOpen: (state, action) => {
      state.isConfirmModal = action.payload;
    },

    setIsConfirm: (state, action) => {
      state.isConfirm = action.payload;
    },
  },
});

export const {
  setAllInvoice,
  setAllInvoiceDetailList,
  setNewInvoices,
  setDefaultColor,
  setDefaultBackground,
  setDeleteId,
  setEditedId,
  setSettingModalOpen,
  setConfirmModalOpen,
  setIsConfirm,
  onConfirmDeletedInvoice,
  onConfirmEditInvoice,
  updateNewInvoiceForm,
  updateNewInvoiceFormField,
  updateExisitingInvoiceForm,
} = invoiceSlice.actions;

export const getAllInvoiceSelector = (state) => state.invoices.data;

export const getAllColorSelector = (state) => state.invoices.colors;

export const getAllImageSelector = (state) => state.invoices.images;

export const getCurrentBGImage = (state) => state.invoices.defaultBgImage;

export const getCurrentColor = (state) => state.invoices.defaultColor;

export const getAllInvoiceDetailSelector = (state) => state.invoices.detailList;

export const getInvoiceDetailByID = (id) => (state) =>
  state.invoices.detailList.find((detail) => detail.id === id);

export const getDeletedInvoiceForm = (state) => state.invoices.deletedID;

export const getInvoiceNewForm = (state) => state.invoices.newForm;

export const getInvoiceSettingModal = (state) => state.invoices.settingOpen;

export const getIsInvoiceConfirmModal = (state) =>
  state.invoices.isConfirmModal;

export const getIsConfirm = (state) => state.invoices.isConfirm;

export const getTotalBalance = (state) => {
  try {
    const total = state.invoices.data.reduce((prev, next) => {
      const amount = parseFloat(next.totalAmount) || 0;
      return prev + amount;
    }, 0);
    
    // Format to 2 decimal places and parse back to number
    const formatted = parseFloat(total.toFixed(2));
    return isNaN(formatted) ? 0 : formatted;
  } catch (error) {
            secureLogger.error("Error calculating total balance:", error);
    return 0;
  }
};

export default invoiceSlice.reducer;
