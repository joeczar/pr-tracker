import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './style.css';

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

app.use(router);

app.use(VueQueryPlugin, {
  queryClient,
} as VueQueryPluginOptions);

app.mount('#app');
