<script setup lang="ts">
import { ref } from 'vue'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'

const timeframe = ref<'7d' | '30d' | '90d'>('7d')
const loading = ref(true)

// Simulate initial loading state; replace with real data fetch later
setTimeout(() => {
  loading.value = false
}, 600)
</script>

<template>
  <section aria-labelledby="analytics-title" class="space-y-6">
    <header class="flex items-center justify-between">
      <h1 id="analytics-title" class="text-xl font-semibold tracking-tight">Analytics</h1>
      <div class="text-xs text-slate-500">Timeframe and loading states</div>
    </header>

    <!-- Timeframe Tabs -->
    <Tabs v-model="timeframe" class="w-full">
      <TabsList>
        <TabsTrigger value="7d">7d</TabsTrigger>
        <TabsTrigger value="30d">30d</TabsTrigger>
        <TabsTrigger value="90d">90d</TabsTrigger>
      </TabsList>

      <!-- Filters / Controls -->
      <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <template v-if="loading">
          <Skeleton class="h-10 w-full" />
          <Skeleton class="h-10 w-full" />
          <Skeleton class="h-10 w-full" />
          <Skeleton class="h-10 w-full" />
        </template>
        <template v-else>
          <div class="h-10 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
          <div class="h-10 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
          <div class="h-10 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
          <div class="h-10 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
        </template>
      </div>

      <!-- Charts Grid -->
      <div class="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TabsContent :value="timeframe">
          <section aria-label="Comments trend" class="rounded border border-slate-200 dark:border-slate-800 p-4">
            <template v-if="loading">
              <Skeleton class="h-56 w-full" />
            </template>
            <template v-else>
              <div class="h-56 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
            </template>
          </section>
        </TabsContent>

        <TabsContent :value="timeframe">
          <section aria-label="Change-request rate" class="rounded border border-slate-200 dark:border-slate-800 p-4">
            <template v-if="loading">
              <Skeleton class="h-56 w-full" />
            </template>
            <template v-else>
              <div class="h-56 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
            </template>
          </section>
        </TabsContent>

        <TabsContent :value="timeframe">
          <section aria-label="Average comments per PR" class="rounded border border-slate-200 dark:border-slate-800 p-4">
            <template v-if="loading">
              <Skeleton class="h-56 w-full" />
            </template>
            <template v-else>
              <div class="h-56 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
            </template>
          </section>
        </TabsContent>

        <TabsContent :value="timeframe">
          <section aria-label="Streaks" class="rounded border border-slate-200 dark:border-slate-800 p-4">
            <template v-if="loading">
              <Skeleton class="h-56 w-full" />
            </template>
            <template v-else>
              <div class="h-56 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
            </template>
          </section>
        </TabsContent>
      </div>
    </Tabs>

  </section>
</template>
