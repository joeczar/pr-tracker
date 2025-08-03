import { defineStore } from 'pinia';
import { authApi, type AuthenticatedUser } from '../lib/api/auth';

type AuthState = {
  authenticated: boolean;
  user: AuthenticatedUser | null;
  loading: boolean;
  checked: boolean; // whether we've performed an initial status check
  error: string | null;
};

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    authenticated: false,
    user: null,
    loading: false,
    checked: false,
    error: null,
  }),

  actions: {
    async checkStatus() {
      this.loading = true;
      this.error = null;
      try {
        const res = await authApi.status();
        this.authenticated = !!res.authenticated;
        // Some /auth/status may include user; otherwise leave null until /me
        this.user = (res as any).user || null;
        // If authenticated but user not present, try me()
        if (this.authenticated && !this.user) {
          try {
            const me = await authApi.me();
            this.user = me.user;
          } catch {
            // ignore me() errors; rely on status
          }
        }
      } catch (e: any) {
        this.authenticated = false;
        this.user = null;
        this.error = e?.message || 'Failed to determine auth status';
      } finally {
        this.checked = true;
        this.loading = false;
      }
    },

    setUser(user: AuthenticatedUser | null) {
      this.user = user;
      this.authenticated = !!user;
    },

    async logout() {
      this.loading = true;
      this.error = null;
      try {
        await authApi.logout();
      } finally {
        // Whether or not logout call errors, clear local state
        this.authenticated = false;
        this.user = null;
        this.loading = false;
        this.checked = true;
      }
    },
  },
});
