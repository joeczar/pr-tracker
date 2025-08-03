import { createRouter, createWebHistory } from "vue-router";

const routes = [
  { path: "/", name: "dashboard", component: () => import("../views/Dashboard.vue") },
  { path: "/repositories", name: "repositories", component: () => import("../views/Repositories.vue") },
  { path: "/repositories/:id", name: "repository-detail", component: () => import("../views/RepositoryDetail.vue") },
  { path: "/analytics", name: "analytics", component: () => import("../views/Analytics.vue") },
  { path: "/settings", name: "settings", component: () => import("../views/Settings.vue") },
  { path: "/login", name: "login", component: () => import("../views/Login.vue") },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
