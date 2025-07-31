import { createSlice } from "@reduxjs/toolkit";
import localforage from "localforage";
import { nanoid } from "nanoid";
import { sanitizeDataForStorage } from "../utils/storage";
import { PRODUCTS_KEY, PRODUCT_FORM_KEY } from "../constants/localKeys";
import subscriptionService from "../services/subscriptionService";
import userService from "../services/userService";

const initialState = {
  openProductSelector: false,
  selectedProduct: null,
  data: [],
  newForm: {
    id: nanoid(),
    productID: "",
    image: "",
    name: "",
    amount: 0,
  },
  editedID: null,
  deletedID: null,
};

export const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    addNewProduct: (state, action) => {
      // Check subscription limits before adding product
      const user = userService.getCurrentUser();
      if (user && !subscriptionService.canCreateResource('products', state.data.length)) {
        console.log('PRODUCT CREATION BLOCKED: Subscription limit reached');
        return; // Don't add product if limit is reached
      }
      
      const newDatas = [...state.data, action.payload];
      state.data = newDatas;
      localforage.setItem(PRODUCTS_KEY, sanitizeDataForStorage(newDatas));

      const reNewForm = {
        id: nanoid(),
        image: "",
        productID: "",
        name: "",
        amount: 0,
      };

      state.newForm = { ...reNewForm };
      localforage.setItem(PRODUCT_FORM_KEY, sanitizeDataForStorage(reNewForm));
    },

    updateNewProductForm: (state, action) => {
      state.newForm = { ...action.payload };
      localforage.setItem(PRODUCT_FORM_KEY, sanitizeDataForStorage({ ...state.newForm }));
    },

    updateNewProductFormField: (state, action) => {
      state.newForm[action.payload.key] = action.payload.value;
      localforage.setItem(PRODUCT_FORM_KEY, sanitizeDataForStorage({ ...state.newForm }));
    },

    setAllProducts: (state, action) => {
      let productData = action.payload || [];
      
      // Apply subscription limits to existing data
      const user = userService.getCurrentUser();
      if (user) {
        const plans = subscriptionService.getSubscriptionPlans();
        const currentPlan = plans[user.subscription_tier] || plans.free;
        const productLimit = currentPlan.limitations.products;
        
        // If user has a limit and data exceeds it, truncate the data
        if (productLimit !== -1 && productData.length > productLimit) {
          console.log(`PRODUCT LIMIT ENFORCEMENT: Truncating ${productData.length} products to ${productLimit} for ${currentPlan.name} plan`);
          productData = productData.slice(0, productLimit);
        }
      }
      
      state.data = [...productData];
    },

    setDeleteId: (state, action) => {
      state.deletedID = action.payload;
    },

    setEditedId: (state, action) => {
      state.editedID = action.payload;
    },

    onConfirmDeletedProduct: (state, action) => {
      const newDatas = state.data.filter(
        (product) => product.id !== state.deletedID
      );
      state.data = newDatas;
      state.deletedID = null;
      localforage.setItem(PRODUCTS_KEY, sanitizeDataForStorage(newDatas));
    },

    onConfirmEditProduct: (state, action) => {
      const isFindIndex = state.data.findIndex(
        (product) => product.id === state.editedID
      );
      if (isFindIndex !== -1) {
        state.data[isFindIndex] = { ...action.payload };
      }
      state.editedID = null;
      localforage.setItem(PRODUCTS_KEY, sanitizeDataForStorage([...state.data]));
    },

    setOpenProductSelector: (state, action) => {
      state.openProductSelector = action.payload;
      if (!action.payload) {
        state.selectedProduct = null;
      }
    },

    setProductSelector: (state, action) => {
      const isFindIndex = state.data.findIndex(
        (product) => product.id === action.payload
      );
      if (isFindIndex !== -1) {
        state.selectedProduct = state.data[isFindIndex];
      }
    },
  },
});

export const {
  addNewProduct,
  updateNewProductForm,
  updateNewProductFormField,
  setAllProducts,
  setDeleteId,
  setEditedId,
  onConfirmDeletedProduct,
  onConfirmEditProduct,
  setOpenProductSelector,
  setProductSelector,
} = productSlice.actions;

export const getAllProductSelector = (state) => state.products.data;

export const getProductNewForm = (state) => state.products.newForm;

export const getDeletedProductForm = (state) => state.products.deletedID;

export const getEditedIdForm = (state) => state.products.editedID;

export const getIsOpenProductSelector = (state) =>
  state.products.openProductSelector;

export const getSelectedProduct = (state) => state.products.selectedProduct;

export default productSlice.reducer;
