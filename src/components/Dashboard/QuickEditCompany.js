import React, { useCallback, useEffect, useMemo, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import Button from "../Button/Button";
import ImageUpload from "../Common/ImageUpload";
import SectionTitle from "../Common/SectionTitle";
import { getCompanyData, updateCompanyData } from "../../store/companySlice";
import { useAppContext } from "../../context/AppContext";
import {
  defaultInputStyle,
  defaultInputInvalidStyle,
  defaultInputLargeStyle,
  defaultInputLargeInvalidStyle,
  defaultSkeletonLargeStyle,
  defaultSkeletonNormalStyle,
} from "../../constants/defaultStyles";

const emptyForm = {
  id: "",
  image: "",
  companyName: "",
  companyEmail: "",
  companyMobile: "",
  billingAddress: "",
  companyGST: "",
  companyUDYAM: "",
  companySAC: "",
  bankName: "",
  accountName: "",
  accountNumber: "",
  branchName: "",
  ifscCode: "",
  sealImage: "",
};

function QuickEditCompany({ isShowDetail = false, alreadySet = false }) {
  const dispatch = useDispatch();
  const company = useSelector(getCompanyData);
  const { initLoading: isInitLoading } = useAppContext();
  const [isTouched, setIsTouched] = useState(false);
  const [companyForm, setCompanyForm] = useState(emptyForm);
  const [validForm, setValidForm] = useState(
    Object.keys(emptyForm).reduce((a, b) => {
      return { ...a, [b]: false };
    }, {})
  );

  const onChangeImage = useCallback((str) => {
    setCompanyForm((prev) => ({ ...prev, image: str }));
  }, []);

  const onChangeSealImage = useCallback((str) => {
    setCompanyForm((prev) => ({ ...prev, sealImage: str }));
  }, []);

  // const clearForm = useCallback(() => {
  //   setCompanyForm({ ...emptyForm });
  // }, []);

  const handlerCompanyValue = useCallback((event, keyName) => {
    const value = event.target.value;
    setCompanyForm((prev) => ({ ...prev, [keyName]: value }));
  }, []);

  const submitHandler = useCallback(() => {
    setIsTouched(true);

    const isValid = Object.keys(validForm).every((key) => validForm[key]);

    if (!isValid) {
      toast.error("Invalid Company Form!", {
        position: "bottom-center",
        autoClose: 2000,
      });
      return;
    }

    toast.success("Wow so easy to Update!", {
      position: "bottom-center",
      autoClose: 2000,
    });

    dispatch(updateCompanyData(companyForm));
  }, [companyForm, dispatch, validForm]);

  const imageUploadClasses = useMemo(() => {
    const defaultStyle = "rounded-xl ";

    if (isTouched && !companyForm.image) {
      return defaultStyle + " border-dashed border-2 border-red-400 ";
    }

    if (!companyForm.image) {
      return defaultStyle + " border-dashed border-2 border-indigo-400 ";
    }

    return defaultStyle;
  }, [companyForm, isTouched]);

  useEffect(() => {
    if (company) {
      setCompanyForm(company);
    }
  }, [company]);

  useEffect(() => {
    setValidForm((prev) => ({
      id: true,
      image: companyForm.image ? true : false,
      companyName: companyForm.companyName ? true : false,
      companyEmail: companyForm.companyEmail ? true : false,
      companyMobile: companyForm.companyMobile ? true : false,
      billingAddress: companyForm.billingAddress ? true : false,
      companyGST: companyForm.companyGST ? true : false,
      companyUDYAM: companyForm.companyUDYAM ? true : false,
      companySAC: true, // Optional field
      bankName: true, // Optional field
      accountName: true, // Optional field
      accountNumber: true, // Optional field
      branchName: true, // Optional field
      ifscCode: true, // Optional field
      sealImage: true, // Optional field
    }));
  }, [companyForm]);

  return (
    <div className="bg-white rounded-xl p-4 mt-4">
      <SectionTitle> Quick Edit Company </SectionTitle>
      <div className="flex mt-2">
        {isInitLoading ? (
          <Skeleton className="skeleton-input-radius skeleton-image border-dashed border-2" />
        ) : (
          <ImageUpload
            onChangeImage={onChangeImage}
            keyName="QuickEditImageUpload"
            className={imageUploadClasses}
            url={companyForm.image}
          />
        )}

        <div className="flex-1 pl-3">
          {isInitLoading ? (
            <Skeleton className={defaultSkeletonLargeStyle} />
          ) : (
            <input
              value={companyForm.companyName}
              placeholder="Company Name"
              className={
                !validForm.companyName && isTouched
                  ? defaultInputLargeInvalidStyle
                  : defaultInputLargeStyle
              }
              onChange={(e) => handlerCompanyValue(e, "companyName")}
              disabled={isInitLoading}
            />
          )}
        </div>
      </div>

      <div className="flex mt-2">
        <div className="flex-1">
          {isInitLoading ? (
            <Skeleton className={defaultSkeletonNormalStyle} />
          ) : (
            <input
              value={companyForm.billingAddress}
              placeholder="Company Address"
              className={
                !validForm.billingAddress && isTouched
                  ? defaultInputInvalidStyle
                  : defaultInputStyle
              }
              onChange={(e) => handlerCompanyValue(e, "billingAddress")}
              disabled={isInitLoading}
            />
          )}
        </div>
      </div>

      <>
        <div className="flex mt-2">
          <div className="flex-1">
            {isInitLoading ? (
              <Skeleton className={defaultSkeletonNormalStyle} />
            ) : (
              <input
                value={companyForm.companyEmail}
                placeholder="Company Email"
                className={
                  !validForm.companyEmail && isTouched
                    ? defaultInputInvalidStyle
                    : defaultInputStyle
                }
                onChange={(e) => handlerCompanyValue(e, "companyEmail")}
                disabled={isInitLoading}
              />
            )}
          </div>
        </div>

        <div className="flex mt-2">
        <div className="flex-1">
          {isInitLoading ? (
            <Skeleton className={defaultSkeletonNormalStyle} />
          ) : (
            <input
              value={companyForm.companyGST}
              placeholder="Company GST"
              className={
                !validForm.companyGST && isTouched
                  ? defaultInputInvalidStyle
                  : defaultInputStyle
              }
              onChange={(e) => handlerCompanyValue(e, "companyGST")}
              disabled={isInitLoading}
            />
          )}
        </div>
      
        </div>
        <div className="flex mt-2">
        <div className="flex-1">
          {isInitLoading ? (
            <Skeleton className={defaultSkeletonNormalStyle} />
          ) : (
            <input
              value={companyForm.companyUDYAM}
              placeholder="Company UDYAM"
              className={
                !validForm.companyUDYAM && isTouched
                  ? defaultInputInvalidStyle
                  : defaultInputStyle
              }
              onChange={(e) => handlerCompanyValue(e, "companyUDYAM")}
              disabled={isInitLoading}
            />
          )}
        </div>

        </div>
        <div className="flex mt-2">
        <div className="flex-1">
          {isInitLoading ? (
            <Skeleton className={defaultSkeletonNormalStyle} />
          ) : (
            <input
              value={companyForm.companySAC}
              placeholder="Company SAC"
              className={
                !validForm.companySAC && isTouched
                  ? defaultInputInvalidStyle
                  : defaultInputStyle
              }
              onChange={(e) => handlerCompanyValue(e, "companySAC")}
              disabled={isInitLoading}
            />
          )}
        </div>
    
        </div>
        <div className="flex mt-2">
          <div className="flex-1">
            {isInitLoading ? (
              <Skeleton className={defaultSkeletonNormalStyle} />
            ) : (
              <input
                value={companyForm.companyMobile}
                placeholder="Company Phone"
                className={
                  !validForm.companyMobile && isTouched
                    ? defaultInputInvalidStyle
                    : defaultInputStyle
                }
                onChange={(e) => handlerCompanyValue(e, "companyMobile")}
                disabled={isInitLoading}
              />
            )}
          </div>
        </div>
      </>

      {/* Bank Details Section */}
      <div className="mt-4 border-t pt-4">
        <h4 className="font-title text-lg font-semibold mb-3 text-gray-700">Bank Details</h4>
        
        <div className="flex mt-2">
          <div className="flex-1">
            {isInitLoading ? (
              <Skeleton className={defaultSkeletonNormalStyle} />
            ) : (
              <input
                value={companyForm.bankName}
                placeholder="Bank Name (e.g., UNION BANK OF INDIA)"
                className={defaultInputStyle}
                onChange={(e) => handlerCompanyValue(e, "bankName")}
                disabled={isInitLoading}
              />
            )}
          </div>
        </div>

        <div className="flex mt-2">
          <div className="flex-1">
            {isInitLoading ? (
              <Skeleton className={defaultSkeletonNormalStyle} />
            ) : (
              <input
                value={companyForm.accountName}
                placeholder="Account Name (A/c Name)"
                className={defaultInputStyle}
                onChange={(e) => handlerCompanyValue(e, "accountName")}
                disabled={isInitLoading}
              />
            )}
          </div>
        </div>

        <div className="flex mt-2">
          <div className="flex-1">
            {isInitLoading ? (
              <Skeleton className={defaultSkeletonNormalStyle} />
            ) : (
              <input
                value={companyForm.accountNumber}
                placeholder="Account Number (A/c Number)"
                className={defaultInputStyle}
                onChange={(e) => handlerCompanyValue(e, "accountNumber")}
                disabled={isInitLoading}
              />
            )}
          </div>
        </div>

        <div className="flex mt-2">
          <div className="flex-1">
            {isInitLoading ? (
              <Skeleton className={defaultSkeletonNormalStyle} />
            ) : (
              <input
                value={companyForm.branchName}
                placeholder="Branch (e.g., Vijanapura Branch)"
                className={defaultInputStyle}
                onChange={(e) => handlerCompanyValue(e, "branchName")}
                disabled={isInitLoading}
              />
            )}
          </div>
        </div>

        <div className="flex mt-2">
          <div className="flex-1">
            {isInitLoading ? (
              <Skeleton className={defaultSkeletonNormalStyle} />
            ) : (
              <input
                value={companyForm.ifscCode}
                placeholder="IFSC Code (e.g., UBIN0545473)"
                className={defaultInputStyle}
                onChange={(e) => handlerCompanyValue(e, "ifscCode")}
                disabled={isInitLoading}
              />
            )}
          </div>
        </div>
      </div>

      {/* Seal/Signature Section */}
      <div className="mt-4 border-t pt-4">
        <h4 className="font-title text-lg font-semibold mb-3 text-gray-700">Authorized Signature Seal</h4>
        <div className="flex mt-2">
          {isInitLoading ? (
            <Skeleton className="skeleton-input-radius skeleton-image border-dashed border-2" />
          ) : (
            <ImageUpload
              onChangeImage={onChangeSealImage}
              keyName="SealImageUpload"
              className="rounded-xl border-dashed border-2 border-indigo-400"
              url={companyForm.sealImage}
            />
          )}
          <div className="flex-1 pl-3 flex items-center">
            <p className="text-sm text-gray-600">
              Upload your company seal or authorized signature image for invoices
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <Button onClick={submitHandler} block={1}>
          <span className="inline-block ml-2"> Submit </span>
        </Button>
      </div>
    </div>
  );
}

export default QuickEditCompany;
