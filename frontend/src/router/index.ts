import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";

const routes = [
  { path: "/", name: "dashboard", component: () => import("../views/Dashboard.vue") },
  { path: "/repositories", name: "repositories", component: () => import("../views/Repositories.vue") },
  { path: "/repositories/:id", name: "repository-detail", component: () => import("../views/RepositoryDetail.vue") },
  { path: "/analytics", name: "analytics", component: () => import("../views/Analytics.vue") },
  { path: "/settings", name: "settings", component: () => import("../views/Settings.vue") },
  { path: "/login", name: "login", component: () => import("../views/Login.vue") },
  { path: "/auth/error", name: "auth-error", component: () => import("../views/Login.vue") }, // placeholder route
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Global auth guard
router.beforeEach(async (to, _from, next) => {
  const publicRoutes = ["/login", "/auth/error"];
  if (publicRoutes.includes(to.path)) return next();

  const auth = useAuthStore();
  if (!auth.checked && !auth.loading) {
    await auth.checkStatus();
  }
  if (!auth.authenticated) {
    return next({ path: "/login", query: { redirect: to.fullPath } });
  }
  next();
});

export default router;
