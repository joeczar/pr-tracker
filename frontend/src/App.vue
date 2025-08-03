<script setup lang="ts">
import AppShell from "./components/layout/AppShell.vue"
import Toaster from "@/components/ui/toast/Toaster.vue"
</script>

<template>
  <AppShell>
    <router-view />
    <!-- Global toast viewport -->
    <Toaster />
  </AppShell>
</template>

<style>
/* no-op */
</style>
