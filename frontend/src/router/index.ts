import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { authApi as _authApi } from "@/lib/api/auth";

const routes = [
  { path: "/", name: "dashboard", component: () => import("../views/Dashboard.vue") },
  { path: "/repositories", name: "repositories", component: () => import("../views/Repositories.vue") },
  { path: "/repositories/:id", name: "repository-detail", component: () => import("../views/RepositoryDetail.vue") },
  { path: "/analytics", name: "analytics", component: () => import("../views/Analytics.vue") },
  { path: "/settings", name: "settings", component: () => import("../views/Settings.vue") },
  { path: "/login", name: "login", component: () => import("../views/Login.vue") },
  { path: "/auth/error", name: "auth-error", component: () => import("../views/AuthError.vue") },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

/**
 * Global auth guard:
 * - Allows public routes: /login and /auth/error
 * - Ensures status is checked once
 * - Redirects unauthenticated users to /login with a redirect back to intended path
 * - If returning from OAuth with ?auth=success on /login, Login.vue handles redirect to target
 */
router.beforeEach(async (to, _from, next) => {
  const publicRoutes = ["/login", "/auth/error"];

  // Handle OAuth callback hint (?auth=success) first
  if (to.query.auth === "success") {
    // After OAuth, validate session and then redirect to target (or /)
    const target = (to.query.redirect as string) || "/";
    const auth = useAuthStore();
    if (!auth.initialized && !auth.loading) {
      await auth.bootstrap();
    }
    return next({ path: target, query: {} });
  }

  // Allow navigation to public routes
  if (publicRoutes.includes(to.path)) {
    return next();
  }

  // Ensure session bootstrap has occurred
  const auth = useAuthStore();
  if (!auth.initialized && !auth.loading) {
    await auth.bootstrap();
  }

  // Gate protected routes
  if (!auth.isAuthenticated) {
    return next({ path: "/login", query: { redirect: to.fullPath } });
  }

  next();
});

export default router;
