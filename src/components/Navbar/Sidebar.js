import React, { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { NavLink, useLocation } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import { useSelector } from "react-redux";
import HomeIcon from "../Icons/HomeIcon";
import ProductIcon from "../Icons/ProductIcon";
import InvoiceIcon from "../Icons/InvoiceIcon";
import ClientPlusIcon from "../Icons/ClientPlusIcon";
import DeleteIcon from "../Icons/DeleteIcon";
import SecurityIcon from "../Icons/SecurityIcon";
import InvoiceNavbarLoading from "../Loading/InvoiceNavbarLoading";
import { getCompanyData } from "../../store/companySlice";
import Skeleton from "react-loading-skeleton";
import ClearDataConfirmModal from "../Common/ClearDataConfirmModal";
import localforage from "localforage";

const NAV_DATA = [
  {
    title: "Dashboard",
    link: "/",
    Icon: HomeIcon,
  },
  {
    title: "Invoices",
    link: "invoices",
    Icon: InvoiceIcon,
  },
  {
    title: "Clients",
    link: "clients",
    Icon: ClientPlusIcon,
  },
  {
    title: "Products",
    link: "products",
    Icon: ProductIcon,
  },
];

const navDefaultClasses =
  "fixed inset-0 duration-200 transform lg:opacity-100 z-10 w-72 bg-white h-screen p-3";

const navItemDefaultClasses = "block px-4 py-2 rounded-md flex flex-1";

function Sidebar() {
  const { showNavbar, initLoading, toggleNavbar } = useAppContext();
  const { pathname } = useLocation();
  const company = useSelector(getCompanyData);
  const [showClearModal, setShowClearModal] = useState(false);

  const onClickNavbar = useCallback(() => {
    const width = window.innerWidth;

    if (width <= 767 && showNavbar) {
      toggleNavbar();
    }
  }, [showNavbar, toggleNavbar]);

  const aboutRoute = useMemo(() => pathname === "/about", [pathname]);

  // Clear selected data handler
  const handleClearData = async (selectedData) => {
    try {
      // Import the constants for localStorage keys
      const { 
        CLIENTS_KEY, 
        CLIENT_FORM_KEY, 
        PRODUCTS_KEY, 
        PRODUCT_FORM_KEY, 
        INVOICES_KEY, 
        INVOICE_DETAILS, 
        INVOICE_FORM_KEY,
        COMPANY_KEY,
        DEFAULT_INVOICE_COLOR,
        DEFAULT_INVOICE_BG 
      } = await import('../../constants/localKeys');

      const clearPromises = [];

      // Clear clients data
      if (selectedData.clients) {
        clearPromises.push(
          localforage.removeItem(CLIENTS_KEY),
          localforage.removeItem(CLIENT_FORM_KEY)
        );
      }

      // Clear products data
      if (selectedData.products) {
        clearPromises.push(
          localforage.removeItem(PRODUCTS_KEY),
          localforage.removeItem(PRODUCT_FORM_KEY)
        );
      }

      // Clear invoices data
      if (selectedData.invoices) {
        clearPromises.push(
          localforage.removeItem(INVOICES_KEY),
          localforage.removeItem(INVOICE_DETAILS),
          localforage.removeItem(INVOICE_FORM_KEY)
        );
      }

      // Clear settings data
      if (selectedData.settings) {
        clearPromises.push(
          localforage.removeItem(COMPANY_KEY),
          localforage.removeItem(DEFAULT_INVOICE_COLOR),
          localforage.removeItem(DEFAULT_INVOICE_BG)
        );
      }

      // Clear forms data (all form-related temporary data)
      if (selectedData.forms) {
        clearPromises.push(
          localforage.removeItem(CLIENT_FORM_KEY),
          localforage.removeItem(PRODUCT_FORM_KEY),
          localforage.removeItem(INVOICE_FORM_KEY)
        );
      }

      // Clear specific localStorage items (but preserve authentication)
      // Note: We avoid localStorage.clear() to preserve Google auth tokens

      // Execute all clear operations
      await Promise.all(clearPromises);

      // Close modal and reload to reflect changes
      setShowClearModal(false);
      window.location.reload();
      
    } catch (error) {
              // Silent - data clearing errors should not expose details
      alert('An error occurred while clearing data. Please try again.');
    }
  };

  return (
    <>
      <nav
        className={
          showNavbar
            ? navDefaultClasses + " translate-x-0 ease-in"
            : navDefaultClasses + " -translate-x-full ease-out"
        }
      >
        <div className="flex flex-col h-full justify-between">
          <div>
            <div className="flex justify-between">
              <motion.span
                className="font-bold font-title text-2xl sm:text-2xl p-2 flex justify-center items-center"
                initial={{
                  translateX: -300,
                }}
                animate={{
                  translateX: showNavbar ? -40 : -300,
                  color: "#0066FF",
                }}
                transition={{
                  type: "spring",
                  damping: 18,
                }}
              >
                <span className="nav-loading">
                  <InvoiceNavbarLoading loop />
                </span>
                Logislip
              </motion.span>
            </div>

            {initLoading && <Skeleton className="px-4 py-5 rounded-md" />}
            {!!company?.image && !initLoading && (
              <motion.span
                className={
                  navItemDefaultClasses + " bg-gray-50 flex items-center px-3"
                }
              >
                <img
                  className={"object-cover h-10 w-10 rounded-lg"}
                  src={company?.image}
                  alt="upload_image"
                />
                <span className="flex-1 pl-2 font-title rounded-r py-1 border-r-4 border-indigo-400 flex items-center inline-block whitespace-nowrap text-ellipsis overflow-hidden ">
                  {company.companyName}
                </span>
              </motion.span>
            )}
            <ul className="mt-4">
              {NAV_DATA.map(({ title, link, Icon }) => (
                <li key={title} className="mb-2">
                  <NavLink
                    to={link}
                    className={" rounded-md side-link"}
                    onClick={onClickNavbar}
                  >
                    {({ isActive }) => (
                      <motion.span
                        key={`${title}_nav_item`}
                        className={
                          isActive
                            ? navItemDefaultClasses + " primary-self-text "
                            : navItemDefaultClasses + " text-default-color "
                        }
                        whileHover={{
                          color: "rgb(0, 102, 255)",
                          backgroundColor: "rgba(0, 102, 255, 0.1)",
                          translateX: isActive ? 0 : 4,
                          transition: {
                            backgroundColor: {
                              type: "spring",
                              damping: 18,
                            },
                          },
                        }}
                        whileTap={{ scale: isActive ? 1 : 0.9 }}
                      >
                        <Icon className="h-6 w-6 mr-4" />
                        {title}
                      </motion.span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>

            <hr />

            <div className="my-4">
              <NavLink to={"about"}>
                <motion.span
                  className="block px-4 py-2 rounded-md flex text-default-color"
                  style={{
                    color: aboutRoute ? "rgb(14 136 14)" : "#777",
                  }}
                  whileHover={{
                    scale: [1.03, 1, 1.03, 1, 1.03, 1, 1.03, 1],
                    color: "rgb(14 136 14)",
                    textShadow: "0px 0px 3px #85FF66",
                    transition: {
                      backgroundColor: {
                        type: "spring",
                        damping: 18,
                      },
                    },
                  }}
                  whileTap={{ scale: 0.9 }}
                >
                  <SecurityIcon className="h-6 w-6 mr-4" />
                  About Me
                </motion.span>
              </NavLink>
            </div>

            <hr />
          </div>
          <div className="mb-4 flex flex-col items-center">
            <motion.button
              className="block px-4 py-2 rounded-md flex w-full mt-2 bg-red-100 border border-red-300 text-red-700 font-semibold shadow text-base items-center justify-center disabled:opacity-60"
              style={{ minWidth: 0 }}
              onClick={() => setShowClearModal(true)}
              whileHover={{ backgroundColor: '#ffeaea', color: '#b91c1c' }}
              whileTap={{ scale: 0.97 }}
            >
              <DeleteIcon className="h-6 w-6 mr-4" />
              Clear Data
            </motion.button>
          </div>
        </div>
      </nav>
      <ClearDataConfirmModal
        open={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={handleClearData}
      />
    </>
  );
}

export default Sidebar;
