import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import Repositories from '../views/Repositories.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: Dashboard,
    },
    {
      path: '/repositories',
      name: 'repositories',
      component: Repositories,
    },
    {
      path: '/repositories/:id',
      name: 'repository-detail',
      component: () => import('../views/RepositoryDetail.vue'),
      props: true,
    },
  ],
})

export default router
