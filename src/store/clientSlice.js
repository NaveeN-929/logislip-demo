import { createSlice } from "@reduxjs/toolkit";
import localforage from "localforage";
import { nanoid } from "nanoid";
import { sanitizeDataForStorage } from "../utils/storage";
import { CLIENTS_KEY, CLIENT_FORM_KEY } from "../constants/localKeys";
import subscriptionService from "../services/subscriptionService";
import userService from "../services/userService";

const initialState = {
  openClientSelector: false,
  selectedClient: null,
  data: [],
  newForm: {
    id: nanoid(),
    image: "",
    name: "",
    email: "",
    billingAddress: "",
    mobileNo: "",
    GST: "",

  },
  editedID: null,
  deletedID: null,
};

export const clientsSlice = createSlice({
  name: "clients",
  initialState,
  reducers: {
    addNewClient: (state, action) => {
      // Check subscription limits before adding client (async check will be handled by component)
      const user = userService.getCurrentUser();
      if (!user) {
        console.log('CLIENT CREATION BLOCKED: No user found');
        return;
      }
      
      const newDatas = [...state.data, action.payload];
      state.data = newDatas;
      localforage.setItem(CLIENTS_KEY, sanitizeDataForStorage(newDatas));

      // Increment usage count in Supabase
      console.log(`📝 Attempting to increment clients count for ID: ${action.payload.id}`);
      userService.incrementResourceUsage('clients', action.payload.id)
        .then((result) => {
          console.log('✅ Client usage count incremented in Supabase:', result);
        })
        .catch(error => {
          console.error('❌ Failed to increment client usage count:', error);
        });

      const reNewForm = {
        id: nanoid(),
        image: "",
        name: "",
        email: "",
        billingAddress: "",
        mobileNo: "",
      };

      state.newForm = { ...reNewForm };
      localforage.setItem(CLIENT_FORM_KEY, sanitizeDataForStorage(reNewForm));
    },

    updateNewClientForm: (state, action) => {
      state.newForm = { ...action.payload };
      localforage.setItem(CLIENT_FORM_KEY, sanitizeDataForStorage({ ...state.newForm }));
    },

    updateNewClientFormField: (state, action) => {
      state.newForm[action.payload.key] = action.payload.value;
      localforage.setItem(CLIENT_FORM_KEY, sanitizeDataForStorage({ ...state.newForm }));
    },

    setAllClients: (state, action) => {
      let clientData = action.payload || [];
      
      // Apply subscription limits to existing data
      const user = userService.getCurrentUser();
      if (user) {
        const plans = subscriptionService.getSubscriptionPlans();
        const currentPlan = plans[user.subscription_tier] || plans.free;
        const clientLimit = currentPlan.limitations.clients;
        
        // If user has a limit and data exceeds it, truncate the data
        if (clientLimit !== -1 && clientData.length > clientLimit) {
          console.log(`CLIENT LIMIT ENFORCEMENT: Truncating ${clientData.length} clients to ${clientLimit} for ${currentPlan.name} plan`);
          clientData = clientData.slice(0, clientLimit);
        }
      }
      
      state.data = [...clientData];
    },

    setDeleteId: (state, action) => {
      state.deletedID = action.payload;
    },

    setEditedId: (state, action) => {
      state.editedID = action.payload;
    },

    onConfirmDeletedClient: (state, action) => {
      const deletedClient = state.data.find(client => client.id === state.deletedID);
      const newDatas = state.data.filter(
        (client) => client.id !== state.deletedID
      );
      state.data = newDatas;
      state.deletedID = null;
      localforage.setItem(CLIENTS_KEY, sanitizeDataForStorage(newDatas));

      // Decrement usage count in Supabase
      if (deletedClient) {
        userService.decrementResourceUsage('clients', deletedClient.id)
          .then(() => {
            console.log('Client usage count decremented in Supabase');
          })
          .catch(error => {
            console.error('Failed to decrement client usage count:', error);
          });
      }
    },

    onConfirmEditClient: (state, action) => {
      const isFindIndex = state.data.findIndex(
        (client) => client.id === state.editedID
      );
      if (isFindIndex !== -1) {
        state.data[isFindIndex] = { ...action.payload };
      }
      state.editedID = null;
      localforage.setItem(CLIENTS_KEY, sanitizeDataForStorage([...state.data]));
    },

    setOpenClientSelector: (state, action) => {
      state.openClientSelector = action.payload;
      if (!action.payload) {
        state.selectedClient = null;
      }
    },

    setClientSelector: (state, action) => {
      const isFindIndex = state.data.findIndex(
        (client) => client.id === action.payload
      );
      if (isFindIndex !== -1) {
        state.selectedClient = state.data[isFindIndex];
      }
    },
  },
});

export const {
  addNewClient,
  updateNewClientForm,
  updateNewClientFormField,
  setAllClients,
  setDeleteId,
  setEditedId,
  onConfirmDeletedClient,
  onConfirmEditClient,
  setOpenClientSelector,
  setClientSelector,
} = clientsSlice.actions;

export const getAllClientsSelector = (state) => state.clients.data;

export const getClientNewForm = (state) => state.clients.newForm;

export const getDeletedClientForm = (state) => state.clients.deletedID;

export const getEditedIdForm = (state) => state.clients.editedID;

export const getIsOpenClientSelector = (state) =>
  state.clients.openClientSelector;

export const getSelectedClient = (state) => state.clients.selectedClient;

export default clientsSlice.reducer;
