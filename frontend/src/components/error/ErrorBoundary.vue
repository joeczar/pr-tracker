<script setup lang="ts">
import { defineProps, defineEmits, ref, onErrorCaptured, h as _h, type VNodeChild } from 'vue';

type FallbackRender = (params: {
  error: unknown;
  resetError: () => void;
}) => VNodeChild;

const _props = defineProps<{
  fallback?: VNodeChild;
  fallbackRender?: FallbackRender;
}>();

const emit = defineEmits<{
  (e: 'error', error: unknown): void;
  (e: 'reset'): void;
}>();

const error = ref<unknown | null>(null);

function resetError() {
  error.value = null;
  emit('reset');
}

// Capture render errors for child tree
onErrorCaptured((err) => {
  error.value = err;
  emit('error', err);
  // returning false allows the error to propagate further if needed
  return false;
});

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'string') return e;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

function getErrorStack(e: unknown): string | undefined {
  if (e instanceof Error && e.stack) return e.stack;
  return undefined;
}
</script>

<template>
  <!-- Render fallback when error exists -->
  <div v-if="error" class="p-4">
    <component
      v-if="fallbackRender"
      :is="{
        render: () =>
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          (fallbackRender!)({
            error,
            resetError,
          }),
      }"
    />
    <template v-else-if="fallback">
      <component :is="fallback" />
    </template>
    <template v-else>
      <!-- Default fallback with diagnostics (message + stack) -->
      <div class="rounded-md border border-red-300 bg-red-50 text-red-900 p-4">
        <div class="flex items-center justify-between mb-2">
          <h2 class="font-semibold">Something went wrong</h2>
          <button
            type="button"
            class="inline-flex items-center rounded border border-red-300 bg-white px-2 py-1 text-sm hover:bg-red-100"
            @click="resetError"
          >
            Retry
          </button>
        </div>
        <p class="text-sm mb-2">
          {{ getErrorMessage(error) }}
        </p>
        <pre v-if="getErrorStack(error)" class="text-xs overflow-auto whitespace-pre-wrap bg-white border border-red-200 rounded p-2">
{{ getErrorStack(error) }}
        </pre>
      </div>
    </template>
  </div>

  <!-- Render children when no error -->
  <slot v-else />
</template>
