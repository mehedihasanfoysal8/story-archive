import type { PKCEChallenge } from "@/types/auth";

/**
 * Generates a cryptographically random PKCE code verifier
 */
export function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

/**
 * Generates a PKCE code challenge from a verifier using SHA-256
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64URLEncode(new Uint8Array(digest));
}

/**
 * Generates both verifier and challenge in one call
 */
export async function generatePKCEChallenge(): Promise<PKCEChallenge> {
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);
  return { verifier, challenge, method: "S256" };
}

/**
 * Generates a cryptographically random state parameter for CSRF protection
 */
export function generateState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

function base64URLEncode(buffer: Uint8Array): string {
  return btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}
