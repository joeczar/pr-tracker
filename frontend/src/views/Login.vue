<script setup lang="ts">
import Card from '@/components/ui/card/Card.vue'
import CardHeader from '@/components/ui/card/CardHeader.vue'
import CardTitle from '@/components/ui/card/CardTitle.vue'
import CardDescription from '@/components/ui/card/CardDescription.vue'
import CardContent from '@/components/ui/card/CardContent.vue'
import CardFooter from '@/components/ui/card/CardFooter.vue'
import Button from '@/components/ui/button/Button.vue'
import Separator from '@/components/ui/separator/Separator.vue'
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
          <Button class="w-full" aria-label="Sign in with GitHub (placeholder)">
            Sign in with GitHub
          </Button>
          <div class="h-10 w-full rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
        </div>
      </CardContent>

      <CardFooter class="justify-center">
        <p class="text-center text-xs text-slate-500">
          Skeleton layout • placeholders only
        </p>
      </CardFooter>
    </Card>
  </section>
</template>
