import type { StoredToken, OAuthToken, GoogleUserProfile } from "@/types/auth";

const TOKEN_KEY = "story_cms_token";
const USER_KEY = "story_cms_user";
const ROOT_FOLDER_KEY = "story_cms_root_folder";

class TokenStorage {
  getToken(): StoredToken | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(TOKEN_KEY);
      if (!raw) return null;
      const token: StoredToken = JSON.parse(raw);
      if (Date.now() >= token.expires_at) {
        this.clearToken();
        return null;
      }
      return token;
    } catch {
      this.clearToken();
      return null;
    }
  }

  setToken(token: OAuthToken): StoredToken {
    const stored: StoredToken = {
      ...token,
      expires_at: Date.now() + token.expires_in * 1000,
    };
    localStorage.setItem(TOKEN_KEY, JSON.stringify(stored));
    return stored;
  }

  clearToken(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
  }

  isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) return false;
    // Treat as expired 60 seconds before actual expiry
    return Date.now() < token.expires_at - 60_000;
  }

  getAccessToken(): string | null {
    return this.getToken()?.access_token ?? null;
  }
}

class UserStorage {
  getUser(): GoogleUserProfile | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  setUser(user: GoogleUserProfile): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  clearUser(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(USER_KEY);
  }
}

import { APP_CONFIG } from "@/config/app";

class RootFolderStorage {
  getRootFolderId(): string | null {
    if (typeof window === "undefined") return APP_CONFIG.defaultRootFolderId;
    return localStorage.getItem(ROOT_FOLDER_KEY) || APP_CONFIG.defaultRootFolderId;
  }

  setRootFolderId(id: string): void {
    localStorage.setItem(ROOT_FOLDER_KEY, id);
  }

  clearRootFolderId(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(ROOT_FOLDER_KEY);
  }
}

class ClientIdStorage {
  getClientId(): string | null {
    if (typeof window === "undefined") return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || null;
    return localStorage.getItem("google_client_id") || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || null;
  }

  setClientId(id: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem("google_client_id", id.trim());
  }

  clearClientId(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem("google_client_id");
  }
}

export const tokenStorage = new TokenStorage();
export const userStorage = new UserStorage();
export const rootFolderStorage = new RootFolderStorage();
export const clientIdStorage = new ClientIdStorage();

export function clearAllStorage(): void {
  tokenStorage.clearToken();
  userStorage.clearUser();
  rootFolderStorage.clearRootFolderId();
}
