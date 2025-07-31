/* eslint-disable no-useless-escape */
import React, { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import {
  getCurrentBGImage,
  getCurrentColor,
  getInvoiceSettingModal,
  setDefaultBackground,
  setDefaultColor,
  setSettingModalOpen,
} from "../../store/invoiceSlice";
import imageData from "../../shared/imageData.json";
import colorData from "../../shared/colorData.json";

function InvoiceSettingModal() {
  const dispatch = useDispatch();
  const openModal = useSelector(getInvoiceSettingModal);
  const currentBg = useSelector(getCurrentBGImage);
  const currentColor = useSelector(getCurrentColor);
  const [animate, setAnimate] = useState(true);

  const onCancelHandler = useCallback(() => {
    dispatch(setSettingModalOpen(false));
  }, [dispatch]);

  const onClickBg = useCallback(
    (item) => {
      dispatch(setDefaultBackground(item));
    },
    [dispatch]
  );

  const onClickColor = useCallback(
    (item) => {
      dispatch(setDefaultColor(item));
    },
    [dispatch]
  );

  useEffect(() => {
    if (openModal !== null) {
      setAnimate(true);
    } else {
      setAnimate(false);
    }
  }, [openModal]);

  return openModal !== false ? (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: animate ? 1 : 0 }}
      transition={{ type: "spring", damping: 18 }}
    >
      <div
        className="absolute inset-0 bg-gray-500 bg-opacity-60 transition-opacity"
        onClick={onCancelHandler}
      ></div>
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-auto p-6 z-10 flex flex-col">
        <div className="font-title text-lg mb-4 text-center">
          Invoice Settings
        </div>
        <div className="mb-4">
          <div className="font-title mb-2">Choose Color</div>
          <div className="flex flex-row flex-wrap justify-center mb-2">
            {colorData.map((color) => (
              <span
                key={color}
                onClick={() => onClickColor(color)}
                className={
                  "inline-block w-8 h-8 mx-1 cursor-pointer rounded-full border-2 transition-all " +
                  (currentColor === color
                    ? " border-blue-500 scale-110 shadow-lg"
                    : " border-gray-200 scale-90 opacity-70 hover:opacity-100")
                }
                style={{ backgroundColor: color }}
              ></span>
            ))}
          </div>
        </div>
        <div className="mb-4">
          <div className="font-title mb-2">Choose Background Image</div>
          <div className="grid grid-cols-3 gap-3 mx-auto">
            {imageData.map((image) => (
              <div
                className={
                  "w-full overflow-hidden h-20 cursor-pointer rounded-lg border-2 transition-all " +
                  (currentBg.id === image.id
                    ? " border-blue-500 scale-105 shadow-lg"
                    : " border-gray-200 scale-95 opacity-80 hover:opacity-100")
                }
                key={image.id}
                onClick={() => onClickBg(image)}
              >
                <img
                  src={image.base64}
                  alt="background"
                  className="object-cover w-full h-full"
                />
              </div>
            ))}
          </div>
        </div>
        <button
          type="button"
          className="mt-4 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          onClick={onCancelHandler}
        >
          Close
        </button>
      </div>
    </motion.div>
  ) : null;
}

export default InvoiceSettingModal;
