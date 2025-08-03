import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";

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
  if (publicRoutes.includes(to.path)) return next();

  const auth = useAuthStore();
  if (!auth.checked && !auth.loading) {
    try {
      await auth.checkStatus();
    } catch {
      // ignore network errors; proceed to gate on flag
    }
  }

  if (!auth.authenticated) {
    return next({ path: "/login", query: { redirect: to.fullPath } });
  }
  next();
});

export default router;
