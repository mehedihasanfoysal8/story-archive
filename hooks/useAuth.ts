"use client";

import { useState, useEffect, useCallback } from "react";
import { initiateOAuthFlow, handleOAuthCallback, revokeToken, fetchUserProfile, refreshAccessTokenSilent } from "@/lib/auth/oauth";
import { tokenStorage, userStorage, rootFolderStorage, clearAllStorage } from "@/lib/auth/storage";
import type { AuthState, GoogleUserProfile, StoredToken } from "@/types/auth";

const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  token: null,
  user: null,
  error: null,
};

export function useAuth() {
  const [state, setState] = useState<AuthState>(initialState);

  const refreshState = useCallback(() => {
    const token = tokenStorage.getToken();
    const user = userStorage.getUser();
    setState({
      isAuthenticated: !!token && !!user,
      isLoading: false,
      token,
      user,
      error: null,
    });
  }, []);

  useEffect(() => {
    refreshState();
  }, [refreshState]);

  const login = useCallback(async (overrideClientId?: string) => {
    try {
      if (overrideClientId) {
        const { clientIdStorage } = await import("@/lib/auth/storage");
        clientIdStorage.setClientId(overrideClientId);
      }
      setState((s) => ({ ...s, isLoading: true, error: null }));
      await initiateOAuthFlow(overrideClientId);
    } catch (err) {
      const msg = (err as Error).message;
      setState((s) => ({
        ...s,
        isLoading: false,
        error: msg,
      }));
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await revokeToken();
    } finally {
      clearAllStorage();
      setState({
        isAuthenticated: false,
        isLoading: false,
        token: null,
        user: null,
        error: null,
      });
    }
  }, []);

  const completeCallback = useCallback(
    async (paramsFromUrl: Record<string, string>) => {
      try {
        setState((s) => ({ ...s, isLoading: true, error: null }));
        const token = await handleOAuthCallback(paramsFromUrl);
        const profile: GoogleUserProfile = await fetchUserProfile(token.access_token);
        userStorage.setUser(profile);
        setState({
          isAuthenticated: true,
          isLoading: false,
          token: tokenStorage.getToken(),
          user: profile,
          error: null,
        });
        return true;
      } catch (err) {
        setState((s) => ({
          ...s,
          isLoading: false,
          error: (err as Error).message,
        }));
        return false;
      }
    },
    []
  );

  // Setup automatic silent refresh
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const checkInterval = setInterval(async () => {
      const storedToken = tokenStorage.getToken();
      if (storedToken) {
        const expiresInMs = storedToken.expires_at - Date.now();
        // Refresh 5 minutes before expiration (300,000 ms)
        if (expiresInMs < 300000 && expiresInMs > 0) {
          try {
            await refreshAccessTokenSilent();
            refreshState();
          } catch (error) {
            console.error("Silent token refresh failed:", error);
          }
        } else if (expiresInMs <= 0) {
          // Token fully expired, force logout
          logout();
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkInterval);
  }, [state.isAuthenticated, refreshState, logout]);

  return {
    ...state,
    login,
    logout,
    completeCallback,
    accessToken: state.token?.access_token || null,
    rootFolderId: rootFolderStorage.getRootFolderId(),
    setRootFolderId: (id: string) => rootFolderStorage.setRootFolderId(id),
  };
}
