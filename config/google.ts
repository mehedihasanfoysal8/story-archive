import { clientIdStorage } from "@/lib/auth/storage";

export const GOOGLE_CONFIG = {
  get clientId() {
    return clientIdStorage.getClientId() || "";
  },
  authEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  revokeEndpoint: "https://oauth2.googleapis.com/revoke",
  userInfoEndpoint: "https://www.googleapis.com/oauth2/v3/userinfo",
  driveApiBase: "https://www.googleapis.com/drive/v3",
  driveUploadBase: "https://www.googleapis.com/upload/drive/v3",
  scopes: [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/drive",
  ].join(" "),
  redirectUri:
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback`
      : `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/callback`,
} as const;

export const getRedirectUri = () => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  if (typeof window !== "undefined") {
    return `${window.location.origin}/auth/callback`;
  }
  return `${appUrl}/auth/callback`;
};
