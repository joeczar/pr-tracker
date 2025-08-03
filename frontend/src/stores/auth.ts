import { defineStore } from 'pinia';
import { authApi, type AuthenticatedUser } from '@/lib/api/auth';

type AuthState = {
  user: AuthenticatedUser | null;
  initialized: boolean;
  loading: boolean;
  error: string | null;
};

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    initialized: false,
    loading: false,
    error: null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.user,
  },
  actions: {
    setUser(user: AuthenticatedUser | null) {
      this.user = user;
    },
    clearUser() {
      this.user = null;
    },
    async bootstrap() {
      if (this.initialized) return;
      this.loading = true;
      this.error = null;
      try {
        const res = await authApi.me();
        this.user = res.user;
      } catch {
        // 401 expected when not logged in
        this.user = null;
      } finally {
        this.initialized = true;
        this.loading = false;
      }
    },
    async logout() {
      try {
        await authApi.logout();
      } finally {
        this.user = null;
        this.initialized = true;
      }
    },
  },
});
