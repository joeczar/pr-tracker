import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './style.css';

import { createPinia } from 'pinia';
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query';
import type { VueQueryPluginOptions } from '@tanstack/vue-query';

// Configure Query Client with sensible defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30s
      refetchOnWindowFocus: false,
      retry: (failureCount: number, error: any) => {
        // Do not auto-retry unauthorized
        if (error?.status === 401) return false;
        return failureCount < 2;
      },
    },
    mutations: {
      retry: 0,
    },
  },
});

const app = createApp(App);

// Install Pinia BEFORE router/guards use stores
const pinia = createPinia();
app.use(pinia);

// Install router (guards will now have active Pinia)
app.use(router);

// Install Vue Query
app.use(VueQueryPlugin, {
  queryClient,
} as VueQueryPluginOptions);

// Mount
app.mount('#app');
