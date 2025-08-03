<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Card from '@/components/ui/card/Card.vue'
import CardHeader from '@/components/ui/card/CardHeader.vue'
import CardTitle from '@/components/ui/card/CardTitle.vue'
import CardDescription from '@/components/ui/card/CardDescription.vue'
import CardContent from '@/components/ui/card/CardContent.vue'
import CardFooter from '@/components/ui/card/CardFooter.vue'
import Separator from '@/components/ui/separator/Separator.vue'
import { API_BASE } from '@/lib/api/http'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()


onMounted(async () => {
  // If we landed here with ?auth=success (after OAuth), re-check status and redirect accordingly
  const authSuccess = route.query.auth === 'success'
  if (authSuccess) {
    try {
      await auth.checkStatus()
    } catch {
      // ignore, guard will handle unauthenticated
    } finally {
      const { redirect } = route.query as { redirect?: string }
      // clean query params then navigate
      const target = redirect || '/dashboard'
      router.replace({ path: target })
    }
  }
})
</script>

<template>
  <section aria-labelledby="login-title" class="min-h-[60vh] grid place-items-center px-4">
    <Card class="w-full max-w-md">
      <CardHeader class="text-center">
        <CardTitle id="login-title" class="text-2xl">Sign in</CardTitle>
        <CardDescription>Authenticate to access your PR analytics</CardDescription>
      </CardHeader>

      <CardContent class="space-y-6">
        <!-- ASCII / Logo placeholder -->
        <div class="rounded border border-dashed border-slate-300 dark:border-slate-700 p-4">
          <div class="h-24 w-full rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
        </div>

        <Separator />

        <!-- Auth options placeholder -->
        <div class="space-y-3">
          <a
            class="w-full inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
            :href="`${API_BASE}/auth/github/login?redirect=${encodeURIComponent((route.query.redirect as string) || route.fullPath || '/dashboard')}`"
            aria-label="Sign in with GitHub"
          >
            Sign in with GitHub
          </a>
          <div class="h-10 w-full rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
        </div>
      </CardContent>

      <CardFooter class="justify-center">
        <p class="text-center text-xs text-slate-500">
          You will be redirected to GitHub to authorize. After successful login you will return here.
        </p>
      </CardFooter>
    </Card>
  </section>
</template>
