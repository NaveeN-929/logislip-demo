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
      // Check subscription limits before adding product (async check will be handled by component)
      const user = userService.getCurrentUser();
      if (!user) {
        console.log('PRODUCT CREATION BLOCKED: No user found');
        return;
      }
      
      const newDatas = [...state.data, action.payload];
      state.data = newDatas;
      localforage.setItem(PRODUCTS_KEY, sanitizeDataForStorage(newDatas));

      // Increment usage count in Supabase
      console.log(`📝 Attempting to increment products count for ID: ${action.payload.id}`);
      userService.incrementResourceUsage('products', action.payload.id)
        .then((result) => {
          console.log('✅ Product usage count incremented in Supabase:', result);
        })
        .catch(error => {
          console.error('❌ Failed to increment product usage count:', error);
        });

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
      const deletedProduct = state.data.find(product => product.id === state.deletedID);
      const newDatas = state.data.filter(
        (product) => product.id !== state.deletedID
      );
      state.data = newDatas;
      state.deletedID = null;
      localforage.setItem(PRODUCTS_KEY, sanitizeDataForStorage(newDatas));

      // Decrement usage count in Supabase
      if (deletedProduct) {
        userService.decrementResourceUsage('products', deletedProduct.id)
          .then(() => {
            console.log('Product usage count decremented in Supabase');
          })
          .catch(error => {
            console.error('Failed to decrement product usage count:', error);
          });
      }
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
