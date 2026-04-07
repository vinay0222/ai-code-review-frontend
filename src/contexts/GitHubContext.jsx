import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext.jsx';
import { getGitHubStatus, getGitHubAuthUrl, disconnectGitHub } from '../api/index.js';

const GitHubContext = createContext(null);

export function GitHubProvider({ children }) {
  const { user } = useAuth();

  const [connected, setConnected]         = useState(false);
  const [githubUsername, setUsername]     = useState(null);
  const [connectedAt, setConnectedAt]     = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [connectError, setConnectError]   = useState('');

  /**
   * Fetch connection status from the backend.
   * Called on mount and after every auth state change or OAuth callback.
   */
  const refresh = useCallback(async () => {
    if (!user) {
      setConnected(false);
      setUsername(null);
      setConnectedAt(null);
      return;
    }
    setStatusLoading(true);
    try {
      const data = await getGitHubStatus();
      setConnected(data.connected);
      setUsername(data.githubUsername || null);
      setConnectedAt(data.connectedAt || null);
    } catch {
      // Silently fail — don't block the app
    } finally {
      setStatusLoading(false);
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  /**
   * Initiate GitHub OAuth.
   * Fetches the authorization URL from the backend (with the Firebase token
   * automatically attached by the api layer), then redirects the browser.
   */
  const connect = useCallback(async () => {
    setConnectError('');
    try {
      const { url } = await getGitHubAuthUrl();
      window.location.href = url;
    } catch (err) {
      setConnectError(err.message || 'Failed to initiate GitHub connection.');
    }
  }, []);

  /**
   * Remove the stored GitHub token from the backend.
   */
  const disconnect = useCallback(async () => {
    try {
      await disconnectGitHub();
      setConnected(false);
      setUsername(null);
      setConnectedAt(null);
    } catch (err) {
      setConnectError(err.message || 'Failed to disconnect GitHub account.');
    }
  }, []);

  return (
    <GitHubContext.Provider
      value={{
        connected,
        githubUsername,
        connectedAt,
        statusLoading,
        connectError,
        connect,
        disconnect,
        refresh,
      }}
    >
      {children}
    </GitHubContext.Provider>
  );
}

export function useGitHub() {
  const ctx = useContext(GitHubContext);
  if (!ctx) throw new Error('useGitHub must be used inside <GitHubProvider>');
  return ctx;
}
