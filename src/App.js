import React, { useState, useEffect, useCallback } from "react";
import { Route, Routes, Navigate, BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Container from "./components/Container/Container";
import DashboardScreen from "./pages/DashboardScreen";
import ClientListScreen from "./pages/clients/ClientListScreen";
import ProductListScreen from "./pages/products/ProductListScreen";
import InvoiceListScreen from "./pages/invoices/InvoiceListScreen";
import InvoiceDetailScreen from "./pages/invoices/InvoiceDetailScreen";
import LandingPage from "./pages/LandingPage";
import LoginScreen from "./pages/LoginScreen";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import TermsOfService from "./pages/legal/TermsOfService";
import ProfileScreen from "./pages/profile/ProfileScreen";
import SubscriptionScreen from "./pages/subscription/SubscriptionScreen";
import useInitApp from "./hook/useInitApp";
import ClientDeleteConfirm from "./components/Clients/ClientDeleteConfirm";
import ClientEditModal from "./components/Clients/ClientEditModal";
import ProductDeleteConfirm from "./components/Product/ProductDeleteConfirm";
import ProductEditModal from "./components/Product/ProductEditModal";
import InvoiceSettingModal from "./components/Invoice/InvoiceSettingModal";
import InvoiceConfirmModal from "./components/Invoice/InvoiceConfirmModal";
import InvoiceDeleteConfirm from "./components/Invoice/InvoiceDeleteConfirm";
import UsageLimitModal from "./components/UsageRestriction/UsageLimitModal";
import userService from "./services/userService";
import { useCloudSync } from "./hooks/useCloudSync";
import PhoneVerificationModal from "./components/Auth/PhoneVerificationModal";
// Remove useUsageTracking import to fix render loop
// import useUsageTracking from "./hooks/useUsageTracking";

const App = () => {
  const { initialSetData } = useInitApp();
  const { initializeSync } = useCloudSync();
  const [googleAuth, setGoogleAuth] = useState({ user: null, token: null });
  const [showUsageLimitModal, setShowUsageLimitModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);

  useEffect(() => {
    initialSetData();
    
    // Only initialize auth once
    const initAuth = async () => {
      const user = userService.getCurrentUser();
      
      if (user) {
        setGoogleAuth({ user, token: 'stored_token' });
        
        // Check if cloud sync has existing authentication
        try {
          const authData = localStorage.getItem('cloudSyncAuth');
          if (authData) {
            const { accessToken, userId, timestamp } = JSON.parse(authData);
            
            // Check if the stored token is still valid (not expired) and looks like a real Google token
            const tokenAge = Date.now() - timestamp;
            const maxTokenAge = 24 * 60 * 60 * 1000; // 24 hours
            
            if (tokenAge < maxTokenAge && accessToken && accessToken.startsWith('ya29.') && userId) {
              // Store the token globally for use in Drive upload
              window.googleAuthDrive = {
                user: user,
                token: accessToken,
              };
              
              // Import cloud sync service to check if already initialized
              const cloudSyncService = (await import('./services/cloudSyncService')).default;
              if (!cloudSyncService.isInitialized()) {
                await initializeSync(accessToken, userId);
              }
            }
          }
        } catch (error) {
          // Silent - cloud sync authentication errors should not expose details
        }
      }
    };
    
    initAuth();
  }, []); // Empty dependency array to run only once

  // Initialize cloud sync when user is authenticated
  useEffect(() => {
    // Only initialize cloud sync if we have a real Google access token
    if (googleAuth.token && googleAuth.user && window.googleAuthDrive?.token) {
      const realToken = window.googleAuthDrive.token;
      const userId = googleAuth.user.email || googleAuth.user.id || 'unknown_user';
      
      // Only initialize if we have a real Google access token
      if (realToken && realToken !== 'stored_token' && realToken !== 'mock_token_for_demo' && realToken.startsWith('ya29.')) {
        initializeSync(realToken, userId).catch(error => {
          // Silent - cloud sync initialization errors should not expose details
          // Don't block the app if cloud sync fails
        });
      }
    }
  }, [googleAuth.token, googleAuth.user, initializeSync]);

  // Prompt for phone verification after sign-in if missing/unverified
  useEffect(() => {
    const user = googleAuth.user
    if (!user) return
    // If the user does not have phone verified, show modal
    if (!user.phone_verified || !user.phone_number) {
      setShowPhoneModal(true)
    }
  }, [googleAuth.user])

  // Handle cloud sync initialization from login
  const handleCloudSyncReady = useCallback(async (accessToken, userId) => {
    try {
      // Only initialize if we have a real access token
      if (accessToken && accessToken.startsWith('ya29.')) { // Google access tokens start with ya29.
        await initializeSync(accessToken, userId);
      } else {
        // Silent - invalid token format should not be logged
      }
    } catch (error) {
              // Silent - cloud sync initialization errors should not expose details
    }
  }, [initializeSync]);

  // If not signed in, show login page only at /signin
  // Removed console.log to prevent spam during re-renders

  // Avoid rendering the private app shell on legal/public pages so consent screen links
  // always show the landing-style pages even for signed-in users
  const legalPaths = ["/privacy-policy", "/terms-of-service"];
  const isLegalPath = legalPaths.includes(window.location.pathname);
  const shouldShowPrivateApp = googleAuth.token && !isLegalPath;

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      {/* Render either public+legal routes OR the private app shell (never both) */}
      {(!googleAuth.token || isLegalPath) ? (
        <Routes>
          <Route
            path="/"
            element={
              <LandingPage
                onAuth={(user) => setGoogleAuth((a) => ({ ...a, user }))}
                onToken={(token) => setGoogleAuth((a) => ({ ...a, token }))}
                onCloudSyncReady={handleCloudSyncReady}
              />
            }
          />
          <Route
            path="/signin"
            element={
              <LoginScreen
                onAuth={(user) => setGoogleAuth((a) => ({ ...a, user }))}
                onToken={(token) => setGoogleAuth((a) => ({ ...a, token }))}
                onCloudSyncReady={handleCloudSyncReady}
              />
            }
          />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      ) : (
        <Container>
          {/* Render client and product modals globally so edit/delete always work */}
          <ClientEditModal />
          <ClientDeleteConfirm />
          <ProductEditModal />
          <ProductDeleteConfirm />
          {/* Render invoice modals globally so setting, save, and delete actions work, aligned with sidebar */}
          <InvoiceSettingModal />
          <InvoiceConfirmModal />
          <InvoiceDeleteConfirm />
          
          {/* User Management Modals */}
          <UsageLimitModal 
            isOpen={showUsageLimitModal}
            onClose={() => setShowUsageLimitModal(false)}
            onUpgrade={() => {
              setShowUsageLimitModal(false);
              // Use window.location for App level navigation since it's outside Router context
              window.location.href = '/subscription';
            }}
          />

          <PhoneVerificationModal
            isOpen={showPhoneModal}
            onClose={() => setShowPhoneModal(false)}
            onVerified={() => {
              setShowPhoneModal(false)
              // refresh user data to reflect verification
              const refreshed = userService.getCurrentUser()
              setGoogleAuth((a) => ({ ...a, user: refreshed }))
            }}
          />
          
          <Routes>
            <Route path="/" element={<Navigate to="/dashboards" replace />} />
            <Route path="/dashboards" element={<DashboardScreen />} />
            <Route path="clients" element={<ClientListScreen />} />
            <Route path="products" element={<ProductListScreen />} />
            <Route path="invoices">
              <Route path="" element={<InvoiceListScreen />} exact />
              <Route path=":id" element={<InvoiceDetailScreen />} />
            </Route>
            
            <Route path="profile" element={<ProfileScreen />} />
            <Route path="subscription" element={<SubscriptionScreen />} />
            <Route path="*" element={<Navigate to="/dashboards" replace />} />
          </Routes>
        </Container>
      )}
      <ToastContainer />
    </BrowserRouter>
  );
};

export default App;
