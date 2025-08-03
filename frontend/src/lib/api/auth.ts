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
  status: () => http.get('/auth/status') as Promise<{ authenticated: boolean; user?: AuthenticatedUser }>,
  me: () => http.get('/auth/me') as Promise<{ user: AuthenticatedUser }>,
  refresh: () => http.post('/auth/refresh') as Promise<{ success: boolean; message?: string }>,
  logout: () => http.post('/auth/logout') as Promise<{ success: boolean; message?: string }>,
  loginRedirect: (redirectPath?: string) => {
    const target = redirectPath || '/dashboard';
    window.location.href = `${API_BASE}/auth/github/login?redirect=${encodeURIComponent(target)}`;
  },
};
