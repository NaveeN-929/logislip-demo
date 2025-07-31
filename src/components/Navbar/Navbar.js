import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import InvoiceNavbarLoading from "../Loading/InvoiceNavbarLoading";
import userService from "../../services/userService";
// Temporarily disable subscription service to prevent Stripe loading
// import subscriptionService from "../../services/subscriptionService";

function Navbar() {
  const navigate = useNavigate();
  const { toggleNavbar, showNavbar } = useAppContext();
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const user = userService.getCurrentUser();
  // Temporarily disable usage stats to prevent Stripe loading
  const usageStats = null; // subscriptionService.getUsageStats();

  const classes = useMemo(() => {
    const defaultClasses =
      "bg-white flex items-center pr-3 z-12 fixed w-full z-10 border-b border-slate-50 transition-all";

    if (!showNavbar) {
      return defaultClasses + " pl-3 ";
    }
    return defaultClasses + " pl-72 ";
  }, [showNavbar]);

  return (
    <header className={classes}>
      <motion.button
        className="p-2 focus:outline-none rounded-md"
        onClick={toggleNavbar}
        initial={{
          translateX: 0,
        }}
        animate={{
          color: showNavbar ? "#777" : "#0066FF",
          rotate: showNavbar ? "360deg" : "0deg",
        }}
        transition={{
          type: "spring",
          damping: 25,
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d={showNavbar ? "M15 19l-7-7 7-7" : "M4 6h16M4 12h16M4 18h7"}
          />
        </svg>
      </motion.button>
      <div
        className="block flex-1 text-2xl sm:text-3xl font-bold p-4 relative justify-center items-center"
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
      >
        {showNavbar && <>&nbsp;</>}
        {!showNavbar && (
          <motion.div
            className=" relative font-bold font-title text-2xl px-2 flex flex-row justify-center items-center"
            initial={{
              translateX: "10vw",
              opacity: 0.8,
            }}
            animate={{
              translateX: 0,
              opacity: 1,
              color: "#0066FF",
            }}
            transition={{
              type: "spring",
              damping: 20,
            }}
          >
            Logislip
            <InvoiceNavbarLoading
              loop
              className="nav-loading-right "
            />
          </motion.div>
        )}
      </div>
      
      {/* User Menu */}
      <div className="relative">
        {/* Usage indicator */}
        {usageStats && !usageStats.isUnlimited && (
          <div className="hidden sm:flex items-center mr-4 text-sm">
            <span className="text-gray-600 mr-2">
              {usageStats.remaining} left
            </span>
            <div className="w-16 bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  usageStats.percentage > 80 ? 'bg-red-500' : 
                  usageStats.percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${usageStats.percentage}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {/* User Avatar */}
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 focus:outline-none"
        >
          <img
            src={user?.avatar_url || 'https://via.placeholder.com/32'}
            alt={user?.name || 'User'}
            className="w-8 h-8 rounded-full"
          />
          <span className="hidden sm:block text-sm font-medium text-gray-700">
            {user?.name || 'User'}
          </span>
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {showUserMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
            <div className="px-4 py-2 border-b">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            
            <button
              onClick={() => {
                setShowUserMenu(false);
                navigate('/profile');
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Profile & Settings
            </button>
            
            <button
              onClick={() => {
                setShowUserMenu(false);
                navigate('/subscription');
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Subscription
            </button>
            
            <div className="border-t">
              <button
                onClick={async () => {
                  setShowUserMenu(false);
                  await userService.logout();
                  window.location.reload();
                }}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;
