import { createSlice } from "@reduxjs/toolkit";
import localforage from "localforage";
import { sanitizeDataForStorage } from "../utils/storage";
import { COMPANY_KEY } from "../constants/localKeys";
import secureLogger from '../utils/secureLogger'

const initialState = {
  data: {
    id: "companyID",
    image: "",
    billingAddress: "",
    companyName: "",
    companyEmail: "",
    companyMobile: "",
    companyGST: "",
    companyUDYAM: "",
    companySAC: "",
    bankName: "",
    accountName: "",
    accountNumber: "",
    branchName: "",
    ifscCode: "",
    sealImage: "",
  },
};

export const companySlice = createSlice({
  name: "company",
  initialState,
  reducers: {
    updateCompanyData: (state, action) => {
      try {
        const {
          image,
          billingAddress,
          companyName,
          companyEmail,
          companyMobile,
          companyGST,
          companyUDYAM,
          companySAC,
          bankName,
          accountName,
          accountNumber,
          branchName,
          ifscCode,
          sealImage
        } = action.payload;
        state.data.image = image ? image : "";
        state.data.billingAddress = billingAddress ? billingAddress : "";
        state.data.companyName = companyName ? companyName : "";
        state.data.companyEmail = companyEmail ? companyEmail : "";
        state.data.companyMobile = companyMobile ? companyMobile : "";
        state.data.companyGST = companyGST ? companyGST : "";
        state.data.companyUDYAM = companyUDYAM ? companyUDYAM : "";
        state.data.companySAC = companySAC ? companySAC : "";
        state.data.bankName = bankName ? bankName : "";
        state.data.accountName = accountName ? accountName : "";
        state.data.accountNumber = accountNumber ? accountNumber : "";
        state.data.branchName = branchName ? branchName : "";
        state.data.ifscCode = ifscCode ? ifscCode : "";
        state.data.sealImage = sealImage ? sealImage : "";
        try {
          const sanitizedData = sanitizeDataForStorage(action.payload);
          localforage.setItem(COMPANY_KEY, sanitizedData);
        } catch (e) {
          secureLogger.error('Error saving company data:', e);
        }
      } catch (e) {
        secureLogger.error('Error updating company data:', e);
      }
    },
  },
});

export const { updateCompanyData } = companySlice.actions;

export const getCompanyData = (state) => state.company.data;

export default companySlice.reducer;
