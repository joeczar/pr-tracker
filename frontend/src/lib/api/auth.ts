import { http, API_BASE } from './http';

export type AuthenticatedUser = {
  id: number;
  github_id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
};

export const authApi = {
  /**
   * Returns whether user is authenticated and optionally user payload.
   */
  status: () => http.get('/auth/status') as Promise<{ authenticated: boolean; user?: AuthenticatedUser }>,

  /**
   * Returns current user when session cookie is valid.
   */
  me: () => http.get('/auth/me') as Promise<{ user: AuthenticatedUser }>,

  /**
   * Refresh session/token if supported by backend.
   */
  refresh: () => http.post('/auth/refresh') as Promise<{ success: boolean; message?: string }>,

  /**
   * Logout current session.
   */
  logout: () => http.post('/auth/logout') as Promise<{ success: boolean; message?: string }>,

  /**
   * Build login URL to backend OAuth entry with redirect.
   */
  getLoginUrl: (targetPath: string = '/') =>
    `${API_BASE}/auth/github/login?redirect=${encodeURIComponent(targetPath)}`,

  /**
   * Redirect browser to GitHub login via backend, with redirect target.
   */
  loginRedirect: (redirectPath?: string) => {
    const target = redirectPath || '/';
    window.location.href = `${API_BASE}/auth/github/login?redirect=${encodeURIComponent(target)}`;
  },
};
