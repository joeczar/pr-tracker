// OAuth and authentication related types

export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
}

export interface User {
  id: number;
  github_id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: Date | null;
  scopes: string[];
  created_at: Date;
  updated_at: Date;
}

export interface UserSession {
  id: string;
  user_id: number;
  expires_at: Date;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
  last_accessed: Date;
}

export interface OAuthState {
  state: string;
  user_session_id: string | null;
  created_at: Date;
  expires_at: Date;
}

export interface GitHubOAuthTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  refresh_token?: string;
  expires_in?: number;
  refresh_token_expires_in?: number;
}

export interface AuthenticatedUser {
  id: number;
  github_id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
}

export interface SessionData {
  user_id: number;
  session_id: string;
  expires_at: Date;
}

// OAuth configuration
export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
  scopes: string[];
}

// Request/Response types for OAuth endpoints
export interface OAuthLoginQuery {
  redirect?: string;
}

export interface OAuthCallbackQuery {
  code: string;
  state: string;
  error?: string;
  error_description?: string;
}

export interface AuthMeResponse {
  user: AuthenticatedUser;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  redirect_url?: string;
}
