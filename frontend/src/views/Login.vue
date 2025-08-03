<script setup lang="ts"></script>

<template>
  <section aria-labelledby="login-title" class="min-h-[60vh] grid place-items-center">
    <div class="w-full max-w-md space-y-6 px-4">
      <header class="text-center space-y-2">
        <h1 id="login-title" class="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p class="text-sm text-slate-500">Authenticate to access your PR analytics</p>
      </header>

      <!-- ASCII / Logo placeholder -->
      <div class="rounded border border-slate-200 dark:border-slate-800 p-4">
        <div class="h-24 w-full rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
      </div>

      <!-- Auth options placeholder -->
      <div class="space-y-3">
        <button
          type="button"
          class="w-full h-10 rounded border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition"
          aria-label="Sign in with GitHub (placeholder)"
        >
          Sign in with GitHub
        </button>
        <div class="h-10 w-full rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
      </div>

      <footer class="text-center text-xs text-slate-500">
        Skeleton layout • placeholders only
      </footer>
    </div>
  </section>
</template>
