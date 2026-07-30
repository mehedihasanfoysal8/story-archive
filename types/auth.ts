export interface OAuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  id_token?: string;
}

export interface StoredToken extends OAuthToken {
  expires_at: number;
  refresh_token?: string;
}

export interface GoogleUserProfile {
  id: string;
  email: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  verified_email: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: StoredToken | null;
  user: GoogleUserProfile | null;
  error: string | null;
}

export interface PKCEChallenge {
  verifier: string;
  challenge: string;
  method: "S256";
}

export interface OAuthCallbackParams {
  code: string;
  state: string;
  error?: string;
  error_description?: string;
}
