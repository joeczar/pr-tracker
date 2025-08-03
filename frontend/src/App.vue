<script setup lang="ts">
import AppShell from "./components/layout/AppShell.vue"
import Toaster from "@/components/ui/toast/Toaster.vue"
import ErrorBoundary from "@/components/error/ErrorBoundary.vue"
</script>

<template>
  <AppShell>
    <ErrorBoundary>
      <router-view />
    </ErrorBoundary>
    <!-- Global toast viewport -->
    <Toaster />
  </AppShell>
</template>

<style>
/* no-op */
</style>
