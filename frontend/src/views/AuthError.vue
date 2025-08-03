<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Card from '@/components/ui/card/Card.vue'
import CardHeader from '@/components/ui/card/CardHeader.vue'
import CardTitle from '@/components/ui/card/CardTitle.vue'
import CardDescription from '@/components/ui/card/CardDescription.vue'
import CardContent from '@/components/ui/card/CardContent.vue'
import CardFooter from '@/components/ui/card/CardFooter.vue'
import Button from '@/components/ui/button/Button.vue'
import Separator from '@/components/ui/separator/Separator.vue'
import { API_BASE } from '@/lib/api/http'

const route = useRoute()
const router = useRouter()

const message = computed(() => (route.query.message as string) || 'Authentication failed')
const error = computed(() => (route.query.error as string) || '')
const details = computed(() => (route.query.details as string) || '')

function backToLogin() {
  const redirect = (route.query.redirect as string) || '/dashboard'
  router.replace({ path: '/login', query: { redirect } })
}

function retryGithub() {
  const redirect = (route.query.redirect as string) || '/dashboard'
  const url = `${API_BASE}/auth/github/login?redirect=${encodeURIComponent(redirect)}`
  window.location.href = url
}
</script>

<template>
  <section aria-labelledby="auth-error-title" class="min-h-[60vh] grid place-items-center px-4">
    <Card class="w-full max-w-lg">
      <CardHeader class="text-center">
        <CardTitle id="auth-error-title" class="text-2xl">Authentication Error</CardTitle>
        <CardDescription>We couldn't complete sign-in with GitHub</CardDescription>
      </CardHeader>

      <CardContent class="space-y-4">
        <div class="rounded-md border border-red-300/60 dark:border-red-800/60 bg-red-50/60 dark:bg-red-950/20 p-3">
          <p class="font-medium text-red-800 dark:text-red-200">{{ message }}</p>
          <p v-if="error" class="mt-1 text-sm text-red-700 dark:text-red-300">
            Error: {{ error }}
          </p>
          <p v-if="details" class="mt-1 text-xs text-red-700/90 dark:text-red-300/90 break-all">
            {{ details }}
          </p>
        </div>

        <Separator />

        <div class="flex flex-col sm:flex-row gap-2 sm:justify-center">
          <Button variant="default" @click="retryGithub" aria-label="Retry GitHub login">
            Try again with GitHub
          </Button>
          <Button variant="secondary" @click="backToLogin" aria-label="Back to login">
            Back to login
          </Button>
        </div>
      </CardContent>

      <CardFooter class="justify-center">
        <p class="text-center text-xs text-slate-500">
          You can retry now or return to the login page. If the issue persists, check your GitHub account permissions.
        </p>
      </CardFooter>
    </Card>
  </section>
</template>
