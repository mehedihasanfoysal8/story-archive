import { GOOGLE_CONFIG, getRedirectUri } from "@/config/google";
import { generateState } from "./pkce";
import { tokenStorage } from "./storage";
import type { OAuthToken } from "@/types/auth";

/**
 * Initiates the OAuth 2.0 authorization flow (Implicit Token Flow)
 */
export async function initiateOAuthFlow(customClientId?: string): Promise<void> {
  const activeClientId = customClientId || GOOGLE_CONFIG.clientId;
  if (!activeClientId) {
    throw new Error("CLIENT_ID_REQUIRED");
  }

  const state = generateState();
  sessionStorage.setItem("oauth_state", state);

  const params = new URLSearchParams({
    client_id: activeClientId,
    redirect_uri: getRedirectUri(),
    response_type: "token",
    scope: GOOGLE_CONFIG.scopes,
    state,
    prompt: "consent",
  });

  window.location.href = `${GOOGLE_CONFIG.authEndpoint}?${params.toString()}`;
}

/**
 * Parses URL hash / query parameters to extract access token
 */
export function parseOAuthHash(hash: string): Record<string, string> {
  const cleanHash = hash.startsWith("#") ? hash.substring(1) : hash;
  const params = new URLSearchParams(cleanHash);
  const result: Record<string, string> = {};
  params.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

/**
 * Handles the OAuth callback and saves token from hash or params
 */
export async function handleOAuthCallback(
  paramsFromUrl: Record<string, string>
): Promise<OAuthToken> {
  const storedState = sessionStorage.getItem("oauth_state");

  const state = paramsFromUrl.state;
  if (storedState && state && state !== storedState) {
    console.warn("State mismatch warning");
  }

  if (paramsFromUrl.error) {
    throw new Error(
      paramsFromUrl.error_description || `OAuth error: ${paramsFromUrl.error}`
    );
  }

  const accessToken = paramsFromUrl.access_token;
  if (!accessToken) {
    throw new Error("No access_token found in authorization response.");
  }

  const expiresIn = Number(paramsFromUrl.expires_in) || 3600;

  const token: OAuthToken = {
    access_token: accessToken,
    expires_in: expiresIn,
    token_type: paramsFromUrl.token_type || "Bearer",
    scope: paramsFromUrl.scope || GOOGLE_CONFIG.scopes,
  };

  // Persist the token
  tokenStorage.setToken(token);

  // Clean up session storage
  sessionStorage.removeItem("oauth_state");

  return token;
}

/**
 * Revokes the current access token and clears storage
 */
export async function revokeToken(): Promise<void> {
  const token = tokenStorage.getToken();
  if (!token) return;

  try {
    await fetch(
      `${GOOGLE_CONFIG.revokeEndpoint}?token=${token.access_token}`,
      { method: "POST" }
    );
  } finally {
    tokenStorage.clearToken();
  }
}

/**
 * Fetches Google user profile using the current access token
 */
export async function fetchUserProfile(accessToken: string) {
  const response = await fetch(GOOGLE_CONFIG.userInfoEndpoint, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user profile");
  }

  return response.json();
}
