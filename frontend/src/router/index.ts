import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import Dashboard from '../views/Dashboard.vue'
import Repositories from '../views/Repositories.vue'
import Login from '../views/Login.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: Login,
      meta: {
        requiresAuth: false,
        hideFromAuthenticatedUsers: true
      },
    },
    {
      path: '/',
      name: 'dashboard',
      component: Dashboard,
      meta: { requiresAuth: true },
    },
    {
      path: '/repositories',
      name: 'repositories',
      component: Repositories,
      meta: { requiresAuth: true },
    },
    {
      path: '/repositories/:id',
      name: 'repository-detail',
      component: () => import('../views/RepositoryDetail.vue'),
      props: true,
      meta: { requiresAuth: true },
    },
  ],
})

// Global navigation guard for authentication
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()

  // Initialize auth store if not already done
  if (!authStore.isInitialized) {
    await authStore.checkAuthStatus()
  }

  const requiresAuth = to.meta.requiresAuth !== false
  const hideFromAuthenticatedUsers = to.meta.hideFromAuthenticatedUsers === true

  // If route requires auth and user is not authenticated
  if (requiresAuth && !authStore.isAuthenticated) {
    // Redirect to login with the intended destination
    next({
      name: 'login',
      query: { redirect: to.fullPath }
    })
    return
  }

  // If user is authenticated and trying to access login page
  if (hideFromAuthenticatedUsers && authStore.isAuthenticated) {
    // Redirect to dashboard or the intended destination
    const redirectPath = (to.query.redirect as string) || '/'
    next(redirectPath)
    return
  }

  // Allow navigation
  next()
})

export default router
