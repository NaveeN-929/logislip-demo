import React from "react";
import Lottie from "lottie-react";
import invoiceLottie from "../lotties/invoice-navbar.json";
import userService from "../services/userService";
import secureLogger from '../utils/secureLogger';

export default function LoginScreen({ onAuth, onToken, onCloudSyncReady }) {
  const [loading, setLoading] = React.useState(false);
  const [tokenClient, setTokenClient] = React.useState(null);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let isMounted = true;
    const id = "google-oauth2-js";
    function initClient() {
      if (!window.google || !window.google.accounts) {
        // Wait and retry a few times before giving up
        let retries = 0;
        const retry = () => {
          if (window.google && window.google.accounts) {
            if (!tokenClient && isMounted) {
              const client = window.google.accounts.oauth2.initTokenClient({
                client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
                scope: "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/gmail.send",
                callback: async (resp) => {
                  if (resp.error) {
                    setError("Google Sign-In failed: " + resp.error);
                    return;
                  }
                  
                  try {
                    setError(null);
                    
                    // Get user profile from Google
                    const googleProfile = await userService.getUserProfile(resp.access_token);
                    
                    // Authenticate user with our service
                    const user = await userService.authenticateUser(googleProfile, resp.access_token);
                    
                    onToken && onToken(resp.access_token);
                    onAuth && onAuth(user);
                    
                    // Store token globally for use in Drive upload
                    window.googleAuthDrive = {
                      user: user,
                      token: resp.access_token,
                    };
                    
                    // Initialize cloud sync
                    if (onCloudSyncReady) {
                      onCloudSyncReady(resp.access_token, user.email || user.id || 'unknown_user');
                    }
                  } catch (error) {
                    secureLogger.error('Authentication error:', error);
                    setError("Authentication failed. Please try again.");
                  }
                },
              });
              setTokenClient(client);
            }
          } else if (retries < 10) {
            retries++;
            setTimeout(retry, 150);
          } else if (isMounted) {
            setError("Google API failed to load");
          }
        };
        retry();
        return;
      }
      if (!tokenClient && isMounted) {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
          scope: "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/gmail.send",
          callback: async (resp) => {
            if (resp.error) {
              setError("Google Sign-In failed: " + resp.error);
              return;
            }
            
            try {
              setError(null);
              
              // Get user profile from Google
              const googleProfile = await userService.getUserProfile(resp.access_token);
              
              // Authenticate user with our service
              const user = await userService.authenticateUser(googleProfile, resp.access_token);
              
              onToken && onToken(resp.access_token);
              onAuth && onAuth(user);
              
              // Store token globally for use in Drive upload
              window.googleAuthDrive = {
                user: user,
                token: resp.access_token,
              };
              
              // Initialize cloud sync
              if (onCloudSyncReady) {
                onCloudSyncReady(resp.access_token, user.email || user.id || 'unknown_user');
              }
            } catch (error) {
              secureLogger.error('Authentication error:', error);
              setError('Authentication failed. Please try again.');
            }
          },
        });
        setTokenClient(client);
      }
    }
    if (!document.getElementById(id)) {
      const js = document.createElement("script");
      js.id = id;
      js.src = "https://accounts.google.com/gsi/client";
      js.onload = () => initClient();
      document.body.appendChild(js);
    } else {
      initClient();
    }
    return () => { isMounted = false; };
    // eslint-disable-next-line
  }, [onAuth, onToken, tokenClient]);

  const handleSignIn = () => {
    if (!tokenClient) {
      setError("Google API not ready");
      return;
    }
    setLoading(true);
    setError(null);
    tokenClient.requestAccessToken();
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #e0e7ff 0%, #f0fdfa 100%)" }}>
      <div style={{
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        padding: 40,
        minWidth: 320,
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}>
        <div style={{ width: 180, height: 80, marginBottom: 16 }}>
          <Lottie animationData={invoiceLottie} loop={true} />
        </div>
        <h1 style={{ fontWeight: 700, fontSize: 28, marginBottom: 8, color: "#2563eb", letterSpacing: 1 }}>Welcome to Logislip</h1>
        <p style={{ color: "#64748b", marginBottom: 24, textAlign: "center" }}>
          Sign in with your Google account to access your dashboard and upload invoices to Google Drive.
        </p>
        <button
          onClick={handleSignIn}
          disabled={loading || !tokenClient}
          style={{
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "12px 32px",
            fontWeight: 600,
            fontSize: 16,
            boxShadow: "0 2px 8px rgba(37,99,235,0.08)",
            cursor: loading || !tokenClient ? "not-allowed" : "pointer",
            marginBottom: 8,
            transition: "background 0.2s"
          }}
        >
          {loading ? "Signing in..." : (
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="22" height="22" viewBox="0 0 48 48" style={{ marginRight: 8 }}>
                <g>
                  <path fill="#4285F4" d="M24 9.5c3.54 0 6.72 1.22 9.22 3.23l6.9-6.9C35.7 1.98 30.18 0 24 0 14.82 0 6.68 5.48 2.69 13.44l8.06 6.26C12.6 13.16 17.87 9.5 24 9.5z"/>
                  <path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.22-.42-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.64 7.01l7.18 5.59C43.98 37.02 46.1 31.27 46.1 24.55z"/>
                  <path fill="#FBBC05" d="M10.75 28.19a14.5 14.5 0 010-8.38l-8.06-6.26A23.94 23.94 0 000 24c0 3.77.9 7.34 2.69 10.45l8.06-6.26z"/>
                  <path fill="#EA4335" d="M24 48c6.18 0 11.7-2.05 15.6-5.59l-7.18-5.59c-2.01 1.35-4.58 2.15-8.42 2.15-6.13 0-11.4-3.66-13.25-8.7l-8.06 6.26C6.68 42.52 14.82 48 24 48z"/>
                  <path fill="none" d="M0 0h48v48H0z"/>
                </g>
              </svg>
              Sign In with Google
            </span>
          )}
        </button>
        {error && <div style={{ color: "#ef4444", marginTop: 8 }}>{error}</div>}
      </div>
      <div style={{ marginTop: 32, color: "#64748b", fontSize: 14, textAlign: "center" }}>
        <span>© {new Date().getFullYear()} Logislip. All rights reserved.</span>
      </div>
    </div>
  );
}
