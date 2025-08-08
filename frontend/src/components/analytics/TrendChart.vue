<script setup lang="ts">
import { computed, onMounted, ref, markRaw } from "vue"
/**
 * shadcn-vue primitives
 */
import Card from '@/components/ui/card/Card.vue'
import CardHeader from '@/components/ui/card/CardHeader.vue'
import CardTitle from '@/components/ui/card/CardTitle.vue'
import CardContent from '@/components/ui/card/CardContent.vue'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'

// Lazy-load chart.js and vue-chartjs to keep bundle lean
const ChartComp = ref<unknown>(null)
const chartModule = ref<unknown>(null)

type XY = { x: string | number | Date; y: number }
type Dataset = {
  label: string
  data: XY[] | number[]
  borderColor?: string
  backgroundColor?: string
  tension?: number
  fill?: boolean | string
  pointRadius?: number
}
type TrendType = "line" | "bar"

const props = withDefaults(
  defineProps<{
    id?: string
    title?: string
    description?: string
    type?: TrendType
    labels?: (string | number | Date)[]
    datasets?: Dataset[]
    reducedMotion?: boolean
    showLegend?: boolean
    ariaSummaryId?: string
    height?: number
    hideChartTitle?: boolean
  }>(),
  {
    id: undefined,
    title: "",
    description: "",
    type: "line",
    labels: () => [],
    datasets: () => [],
    reducedMotion: false,
    showLegend: true,
    ariaSummaryId: undefined,
    height: 220,
    hideChartTitle: false,
  }
)

const canvasId = computed(() => props.id ?? `trend-${Math.random().toString(36).slice(2)}`)

function prefersReducedMotion() {
  if (typeof window === "undefined") return false
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function cyberThemeDefaults(Chart: { defaults: { color?: unknown; font?: { family?: string; size?: number } | undefined; scales?: unknown } }) {
  // Set minimal, local defaults to avoid global side effects
  const gridColor = "rgba(10, 189, 198, 0.2)" // #0abdc6 at 0.2
  const borderColor = "#00ff9f"
  const tickColor = "#9ae8d6"
  const fontFamily = `Fira Code, Cascadia Code, Monaco, monospace`

  ;(Chart.defaults as unknown as { color?: string }).color = tickColor
  if (!Chart.defaults.font) {
    Chart.defaults.font = {} as { family?: string; size?: number }
  }
  Chart.defaults.font.family = fontFamily
  Chart.defaults.font.size = 12
  Chart.defaults.scales = Chart.defaults.scales || {}
  // We won't mutate global too much; per-chart options below handle most styling
  return { gridColor, borderColor, tickColor, fontFamily }
}

const chartOptions = computed(() => {
  const noMotion = props.reducedMotion || prefersReducedMotion()
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: noMotion ? false : { duration: 300 },
    plugins: {
      legend: {
        // Hide legend by default to avoid duplicate labels when a title slot/text is shown.
        display: props.showLegend ?? false,
        labels: {
          boxWidth: 12,
          // Improve contrast in light mode
          color: "#334155", // slate-700
          font: { family: `Fira Code, Cascadia Code, Monaco, monospace` },
        },
      },
      tooltip: {
        enabled: !noMotion,
        backgroundColor: "#0b1228",
        titleColor: "#00ff9f",
        bodyColor: "#d2fff1",
        borderColor: "#10223f",
        borderWidth: 1,
        displayColors: true,
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(10, 189, 198, 0.2)" },
        // Improve tick contrast in light mode while keeping dark mode cyber theme readable
        ticks: { color: "#475569" }, // slate-600
        border: { color: "#cbd5e1" }, // slate-300
      },
      y: {
        grid: { color: "rgba(10, 189, 198, 0.2)" },
        ticks: { color: "#475569" }, // slate-600
        border: { color: "#cbd5e1" }, // slate-300
      },
    },
  }
})

const normalizedData = computed(() => {
  // If labels provided, ensure each dataset aligns
  if (props.labels && props.labels.length) {
    return {
      labels: props.labels,
      datasets: props.datasets.map((d, i) => ({
        label: d.label ?? `Series ${i + 1}`,
        data: d.data as XY[] | number[],
        borderColor: d.borderColor ?? "#00ff9f",
        backgroundColor: d.backgroundColor ?? "rgba(0,255,159,0.1)",
        tension: d.tension ?? 0.25,
        fill: d.fill ?? false,
        pointRadius: d.pointRadius ?? 2,
      })),
    }
  }
  // If datasets contain XY, map labels from x
  const first = props.datasets[0]
  if (first && Array.isArray(first.data) && typeof (first.data as XY[])[0] === 'object') {
    const labels = (first.data as XY[]).map((p) => p.x)
    return {
      labels,
      datasets: props.datasets.map((d, i) => ({
        label: d.label ?? `Series ${i + 1}`,
        data: (d.data as XY[]).map((p) => p.y),
        borderColor: d.borderColor ?? "#00ff9f",
        backgroundColor: d.backgroundColor ?? "rgba(0,255,159,0.1)",
        tension: d.tension ?? 0.25,
        fill: d.fill ?? false,
        pointRadius: d.pointRadius ?? 2,
      })),
    }
  }
  // Fallback
  return {
    labels: [],
    datasets: [],
  }
})

onMounted(async () => {
  const [{ Line, Bar }, ChartJS] = await Promise.all([
    import("vue-chartjs"),
    import("chart.js/auto"), // auto registers required controllers/elements
  ])
  chartModule.value = { Line, Bar, ChartJS }
  cyberThemeDefaults(ChartJS)
  ChartComp.value = markRaw(props.type === "bar" ? Bar : Line)
})
</script>

<template>
  <Card role="img" :aria-label="title || 'Trend chart'">
    <CardHeader v-if="(title || $slots.title) && !props.hideChartTitle" class="pb-0">
      <div class="mb-2 flex items-center justify-between">
        <CardTitle class="font-terminal text-sm text-slate-700 dark:text-[var(--cyber-muted,#9ae8d6)]">
          <slot name="title">{{ title }}</slot>
        </CardTitle>

        <!-- Actions slot enhanced with DropdownMenu and Tooltip -->
        <DropdownMenu>
          <DropdownMenuTrigger
            class="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs font-mono cursor-pointer
                   bg-white text-slate-700 border-slate-300 hover:bg-slate-50
                   dark:bg-transparent dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-800/40"
            aria-label="Chart actions"
          >
            Actions ▾
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-40 font-mono text-xs">
            <DropdownMenuLabel>Chart</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem class="cursor-pointer">
              Export PNG
            </DropdownMenuItem>
            <DropdownMenuItem class="cursor-pointer">
              Export CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </CardHeader>

    <CardContent class="p-3">
      <div :style="{height: `${props.height}px`}" class="relative">
        <component
          v-if="ChartComp"
          :is="ChartComp"
          :data="normalizedData"
          :options="chartOptions"
          :id="canvasId"
          aria-hidden="true"
          role="img"
          :aria-label="title || 'Chart visualization'"
        />
        <div v-else class="h-full w-full animate-pulse bg-[rgba(0,255,159,0.05)]" />
      </div>

      <p v-if="description" class="mt-2 text-xs text-slate-500 dark:text-[var(--cyber-muted,#9ae8d6)]">
        {{ description }}
      </p>

      <figcaption v-if="$slots.summary" :id="ariaSummaryId" class="sr-only">
        <slot name="summary" />
      </figcaption>

      <details class="mt-2">
        <summary class="cursor-pointer text-xs text-slate-700 dark:text-[var(--cyber-primary,#00ff9f)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-[var(--cyber-accent,#ea00d9)] rounded">
          View Data Table
        </summary>
        <div class="overflow-x-auto pt-2">
          <table class="w-full min-w-[480px] border-collapse text-xs text-slate-800 dark:text-[var(--cyber-text,#d2fff1)]">
            <thead>
              <tr class="text-left text-slate-600 dark:text-[var(--cyber-muted,#9ae8d6)]">
                <th class="border-b border-[var(--cyber-border,#10223f)] p-2">Label</th>
                <th
                  v-for="(ds, i) in normalizedData.datasets"
                  :key="i"
                  class="border-b border-[var(--cyber-border,#10223f)] p-2"
                >
                  {{ ds.label }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(label, r) in normalizedData.labels"
                :key="r"
                class="text-[var(--cyber-text,#d2fff1)] odd:bg-[rgba(10,189,198,0.04)]"
              >
                <td class="border-b p-2 border-slate-200 dark:border-[var(--cyber-border,#10223f)]">{{ label }}</td>
                <td
                  v-for="(ds, c) in normalizedData.datasets"
                  :key="c"
                  class="border-b p-2 border-slate-200 dark:border-[var(--cyber-border,#10223f)]"
                >
                  {{ Array.isArray(ds.data) ? (ds.data as XY[] | number[])[r] : '' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>
    </CardContent>
  </Card>
</template>

<style scoped>
:host, :root {
  --cyber-primary: #00ff9f;
  --cyber-secondary: #0abdc6;
  --cyber-accent: #ea00d9;
  --cyber-surface: #0b1228;
  --cyber-border: #10223f;
  --cyber-muted: #9ae8d6;
  --cyber-text: #d2fff1;
}
.font-terminal { font-family: Fira Code, Cascadia Code, Monaco, monospace; }
</style>
