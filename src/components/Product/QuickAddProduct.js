import React, { useState, useCallback, useMemo, useEffect } from "react";
import Skeleton from "react-loading-skeleton";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { nanoid } from "nanoid";
import Button from "../Button/Button";
import ImageUpload from "../Common/ImageUpload";
import SectionTitle from "../Common/SectionTitle";
import { useAppContext } from "../../context/AppContext";
import useSubscriptionLimits from "../../hooks/useSubscriptionLimits";
import UsageLimitModal from "../UsageRestriction/UsageLimitModal";
import {
  defaultInputStyle,
  defaultInputInvalidStyle,
  defaultInputLargeStyle,
  defaultSkeletonLargeStyle,
  defaultSkeletonNormalStyle,
} from "../../constants/defaultStyles";
import {
  addNewProduct,
  getProductNewForm,
  updateNewProductFormField,
} from "../../store/productSlice";

const emptyForm = {
  id: "",
  image: "",
  productID: "",
  name: "",
  amount: 0,
};

function QuickAddProduct() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const productNewForm = useSelector(getProductNewForm);
  const { initLoading: isInitLoading } = useAppContext();
  const { canCreateResource } = useSubscriptionLimits();

  const [isTouched, setIsTouched] = useState(false);
  const [productForm, setProductForm] = useState(emptyForm);
  const [showUsageLimitModal, setShowUsageLimitModal] = useState(false);
  const [canCreateProduct, setCanCreateProduct] = useState(true); // Cache the permission check
  
  // Check permissions once on component mount to avoid repeated calls
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const canCreate = await canCreateResource('products');
        setCanCreateProduct(canCreate);
      } catch (error) {
        // Optimistic fallback - allow creation
        setCanCreateProduct(true);
      }
    };
    
    checkPermissions();
  }, [canCreateResource]);
  const [validForm, setValidForm] = useState(
    Object.keys(emptyForm).reduce((a, b) => {
      return { ...a, [b]: false };
    }, {})
  );

  const onChangeImage = useCallback(
    (str) => {
      setProductForm((prev) => ({ ...prev, image: str }));
      dispatch(updateNewProductFormField({ key: "image", value: str }));
    },
    [dispatch]
  );

  const handlerProductValue = useCallback(
    (event, keyName) => {
      const value = event.target.value;

      setProductForm((prev) => {
        return { ...prev, [keyName]: value };
      });

      dispatch(updateNewProductFormField({ key: keyName, value }));
    },
    [dispatch]
  );

  const submitHandler = useCallback(async () => {
    setIsTouched(true);

    const isValid = Object.keys(validForm).every((key) => validForm[key]);

    if (!isValid) {
      toast.error("Invalid Product Form!", {
        position: "bottom-center",
        autoClose: 2000,
      });
      return;
    }

    try {
      // Check subscription limits before creating product (now async)
      const canCreate = await canCreateResource('products');

      if (!canCreate) {
        console.log('FREE PLAN: Product creation blocked - limit reached');
        toast.error("You've reached your product limit! Upgrade to Pro to add more products.", {
          position: "bottom-center",
          autoClose: 3000,
        });
        setShowUsageLimitModal(true);
        return;
      }

      console.log('FREE PLAN: Product creation allowed - adding product');

      toast.success("Product added successfully!", {
        position: "bottom-center",
        autoClose: 2000,
      });

      const newProductId = nanoid();
      dispatch(addNewProduct({ ...productForm, id: newProductId }));
      
      setIsTouched(false);
      
      // Refresh page to trigger sync
      setTimeout(() => {
        window.location.reload();
      }, 2500);
    } catch (error) {
      console.error('Error checking subscription limits:', error);
      toast.error("Error checking subscription limits. Please try again.", {
        position: "bottom-center",
        autoClose: 3000,
      });
    }
  }, [productForm, dispatch, validForm, canCreateResource]);

  // Handler for when disabled button is clicked - redirect to subscription page
  const handleDisabledClick = useCallback(() => {
    setShowUsageLimitModal(true);
  }, []);

  const handleUpgrade = () => {
    setShowUsageLimitModal(false);
    // Navigate to subscription page
    navigate('/subscription');
  };

  const imageUploadClasses = useMemo(() => {
    const defaultStyle = "rounded-xl ";

    if (!productForm.image) {
      return defaultStyle + " border-dashed border-2 border-indigo-400 ";
    }

    return defaultStyle;
  }, [productForm]);

  useEffect(() => {
    setValidForm((prev) => ({
      id: true,
      image: true,
      name: productForm?.name?.trim() ? true : false,
      amount: productForm?.amount <= 0 ? false : true,
    }));
  }, [productForm]);

  useEffect(() => {
    if (productNewForm) {
      setProductForm(productNewForm);
    }
  }, [productNewForm]);

  return (
    <>
      <div className="bg-white rounded-xl p-4">
        <SectionTitle> Quick Add Product </SectionTitle>
        <div className="flex mt-2">
          {isInitLoading ? (
            <Skeleton className="skeleton-input-radius skeleton-image border-dashed border-2" />
          ) : (
            <ImageUpload
              keyName="QuickEditImageUpload"
              className={imageUploadClasses}
              url={productForm.image}
              onChangeImage={onChangeImage}
            />
          )}

          <div className="flex-1 pl-3">
            {isInitLoading ? (
              <Skeleton className={defaultSkeletonLargeStyle} />
            ) : (
              <div>
                <input
                  autoComplete="nope"
                  value={productForm.productID}
                  placeholder="Product ID"
                  className={defaultInputLargeStyle}
                  onChange={(e) => handlerProductValue(e, "productID")}
                  disabled={isInitLoading}
                />
              </div>
            )}
          </div>
        </div>
        <div className="mt-2">
          <div className="font-title text-sm text-default-color">
            Product Name
          </div>
          <div className="flex">
            <div className="flex-1">
              {isInitLoading ? (
                <Skeleton className={defaultSkeletonNormalStyle} />
              ) : (
                <input
                  autoComplete="nope"
                  placeholder="Product Name"
                  type="text"
                  className={
                    !validForm.name && isTouched
                      ? defaultInputInvalidStyle
                      : defaultInputStyle
                  }
                  disabled={isInitLoading}
                  value={productForm.name}
                  onChange={(e) => handlerProductValue(e, "name")}
                />
              )}
            </div>
          </div>
        </div>
        <div className="mt-2">
          <div className="font-title text-sm text-default-color">
            Product Amount
          </div>
          <div className="flex">
            <div className="flex-1">
              {isInitLoading ? (
                <Skeleton className={defaultSkeletonNormalStyle} />
              ) : (
                <input
                  autoComplete="nope"
                  placeholder="Amount"
                  type="number"
                  className={
                    !validForm.amount && isTouched
                      ? defaultInputInvalidStyle
                      : defaultInputStyle
                  }
                  disabled={isInitLoading}
                  value={productForm.amount}
                  onChange={(e) => handlerProductValue(e, "amount")}
                />
              )}
            </div>
          </div>
        </div>
        <div className="mt-3">
          <Button 
            onClick={canCreateProduct ? submitHandler : handleDisabledClick} 
            block={1}
            disabled={!canCreateProduct}
          >
            <span className="inline-block ml-2"> 
              {canCreateProduct ? 'Submit' : 'Upgrade to Add Products'} 
            </span>
          </Button>
        </div>
      </div>

      {/* Usage Limit Modal */}
      <UsageLimitModal
        isOpen={showUsageLimitModal}
        onClose={() => setShowUsageLimitModal(false)}
        onUpgrade={handleUpgrade}
        resourceType="products"
        message="You've reached your product limit. Upgrade to add more products and expand your inventory!"
      />
    </>
  );
}

export default QuickAddProduct;
