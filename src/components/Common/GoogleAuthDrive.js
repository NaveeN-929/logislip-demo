import React, { useEffect, useState } from "react";
import cloudSyncService from "../../services/cloudSyncService";

// Google OAuth Client ID from environment variables
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.send";
const COMBINED_SCOPE = `${GOOGLE_DRIVE_SCOPE} ${GMAIL_SCOPE}`;

function loadGoogleScript(cb) {
  const id = "google-oauth2-js";
  if (document.getElementById(id)) return cb();
  const js = document.createElement("script");
  js.id = id;
  js.src = "https://accounts.google.com/gsi/client";
  js.onload = cb;
  document.body.appendChild(js);
}

export default function GoogleAuthDrive({ onAuth, onSignOut, onToken, onCloudSyncReady }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tokenClient, setTokenClient] = useState(null);

  // Initialize window.googleAuthDrive immediately
  React.useLayoutEffect(() => {
    if (!window.googleAuthDrive) {
      const existingToken = localStorage.getItem('googleAccessToken');
      if (existingToken) {
        window.googleAuthDrive = {
          token: existingToken,
          user: { name: "Google User" },
          timestamp: Date.now()
        };
        // Silent - token initialization should not log
      }
    }
  }, []);

  useEffect(() => {
    loadGoogleScript(() => {
      if (!window.google || !window.google.accounts) {
        setError("Google API failed to load");
        return;
      }
      // Only initialize once
      if (!tokenClient) {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: COMBINED_SCOPE,
          callback: (resp) => {
            if (resp.error) {
              setError("Google Sign-In failed: " + resp.error);
              setUser(null);
              setToken(null);
              onSignOut && onSignOut();
              return;
            }
            setToken(resp.access_token);
            setUser({ name: "Google User" });
            setError(null);
            
            // Store token globally for other components to access
            window.googleAuthDrive = {
              token: resp.access_token,
              user: { name: "Google User" },
              timestamp: Date.now()
            };
            
            // Also store in localStorage for persistence
            localStorage.setItem('googleAccessToken', resp.access_token);
            
            // Emit custom event for other components to listen to
            window.dispatchEvent(new CustomEvent('googleTokenUpdated', {
              detail: { token: resp.access_token, user: { name: "Google User" } }
            }));
            
            onAuth && onAuth({ name: "Google User" });
            onToken && onToken(resp.access_token);
            
            // Notify that cloud sync can be initialized
            if (onCloudSyncReady) {
              onCloudSyncReady(resp.access_token, "Google User");
            }
          },
        });
        setTokenClient(client);
      }
    });
    // eslint-disable-next-line
  }, [onAuth, onSignOut, onToken, onCloudSyncReady, tokenClient]);

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

  const handleSignOut = () => {
    setUser(null);
    setToken(null);
    setError(null);
    
    // Clear global token storage
    if (window.googleAuthDrive) {
      delete window.googleAuthDrive;
    }
    
    // Clear localStorage
    localStorage.removeItem('googleAccessToken');
    
    // Emit custom event for other components to listen to
    window.dispatchEvent(new CustomEvent('googleTokenUpdated', {
      detail: { token: null, user: null }
    }));
    
    // Clear cloud sync authentication state
    cloudSyncService.logout();
    
    onSignOut && onSignOut();
  };

  return (
    <div>
      {error && <div style={{ color: "red" }}>{error}</div>}
      {/* No sign-out button here; will be placed in the navigation menu below Clear Data */}
    </div>
  );
}
