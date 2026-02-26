<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/store/theme'

const props = defineProps<{
  data: Record<string, number>
}>()

const { t, locale } = useI18n()
const { effectiveTheme } = storeToRefs(useThemeStore())

const CELL_SIZE = 11
const GAP = 2
const LABEL_MARGIN_LEFT = 28
const MONTH_LABEL_HEIGHT = 15
const DAYS_IN_YEAR = 365

const COLOR_LEVELS = [
  { min: 0, max: 0, color: 'rgba(113, 113, 123, 0.08)' },
  { min: 1, max: 3, color: 'rgba(0, 201, 80, 0.30)' },
  { min: 4, max: 6, color: 'rgba(0, 201, 80, 0.50)' },
  { min: 7, max: 9, color: 'rgba(0, 201, 80, 0.72)' },
  { min: 10, max: Infinity, color: 'rgba(0, 201, 80, 0.92)' },
]

const monthLabels = computed(() => {
  return locale.value === 'zh-CN'
    ? [ '一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月' ]
    : [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ]
})
const dayLabels = computed(() => {
  return locale.value === 'zh-CN'
    ? { 1: '周二', 3: '周四', 5: '周六' }
    : { 1: 'Tue', 3: 'Thu', 5: 'Sat' }
})

const isDark = computed(() => effectiveTheme.value === 'dark')

function getColor (count: number): string {
  for (const level of COLOR_LEVELS) {
    if (count >= level.min && count <= level.max) {
      return level.color
    }
  }
  return COLOR_LEVELS[0].color
}

function getLegendColor (index: number): string {
  const level = COLOR_LEVELS[index]
  return level.color
}

function formatDate (d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

interface CellData {
  date: string
  count: number
  x: number
  y: number
  inRange: boolean
}

const grid = computed(() => {
  // Not wanting to deal with timezone,
  // hope someone may have a better idea.
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - DAYS_IN_YEAR + 1)

  // Align to the Monday before startDate
  const startDow = startDate.getDay() // 0=Sun
  const daysSinceMonday = startDow === 0 ? 6 : startDow - 1
  const gridStart = new Date(startDate)
  gridStart.setDate(gridStart.getDate() - daysSinceMonday)

  // Align to the Sunday after today
  const endDow = today.getDay()
  const gridEnd = new Date(today)
  gridEnd.setDate(gridEnd.getDate() + (7 - endDow) % 7)

  const totalDays = Math.round((gridEnd.getTime() - gridStart.getTime()) / 86400000) + 1
  const numWeeks = Math.ceil(totalDays / 7)

  const cells: CellData[][] = []
  const months: { label: string, x: number }[] = []
  let lastMonth = -1

  for (let w = 0; w < numWeeks; w++) {
    const week: CellData[] = []
    for (let d = 0; d < 7; d++) {
      const current = new Date(gridStart)
      current.setDate(current.getDate() + w * 7 + d)
      const dateStr = formatDate(current)
      const inRange = current >= startDate && current <= today
      const count = inRange ? (props.data[dateStr] ?? 0) : 0

      const x = LABEL_MARGIN_LEFT + GAP + w * (CELL_SIZE + GAP)
      const y = MONTH_LABEL_HEIGHT + GAP + d * (CELL_SIZE + GAP)

      if (inRange && current.getDate() === 1 && current.getMonth() !== lastMonth) {
        months.push({ label: monthLabels.value[current.getMonth()], x })
        lastMonth = current.getMonth()
      }

      week.push({ date: dateStr, count, x, y, inRange })
    }
    cells.push(week)
  }

  return { cells, months, numWeeks }
})

const svgWidth = computed(() => {
  return LABEL_MARGIN_LEFT + GAP + grid.value.numWeeks * (CELL_SIZE + GAP) + GAP
})

const svgHeight = computed(() => {
  return MONTH_LABEL_HEIGHT + GAP + 7 * (CELL_SIZE + GAP) + GAP
})

const totalSubmissions = computed(() => {
  return Object.values(props.data).reduce((sum, c) => sum + c, 0)
})

const dayLabelEntries = computed(() => {
  return Object.entries(dayLabels.value).map(([ dayIndex, label ]) => ({
    label,
    y: MONTH_LABEL_HEIGHT + GAP + Number(dayIndex) * (CELL_SIZE + GAP) + CELL_SIZE / 2 + 3.5,
  }))
})

const tooltip = ref<{ visible: boolean, text: string, x: number, y: number }>({
  visible: false,
  text: '',
  x: 0,
  y: 0,
})

function showTooltip (cell: CellData, event: MouseEvent) {
  if (!cell.inRange) return
  const text = cell.count === 0
    ? t('ptoj.heatmap_no_submissions', { date: cell.date })
    : t('ptoj.heatmap_submissions', { count: cell.count, date: cell.date })
  tooltip.value = {
    visible: true,
    text,
    x: event.clientX,
    y: event.clientY,
  }
}

function hideTooltip () {
  tooltip.value.visible = false
}
</script>

<template>
  <div class="submission-heatmap">
    <div class="max-w-full overflow-scroll" style=" direction: rtl;">
      <svg
        class="mx-auto" :width="svgWidth" :height="svgHeight" xmlns="http://www.w3.org/2000/svg"
        style="direction: ltr;"
      >
        <!-- Month labels -->
        <text
          v-for="(month, i) in grid.months" :key="i" :x="month.x" :y="MONTH_LABEL_HEIGHT - 4" font-size="10"
          :fill="isDark ? '#a1a1aa' : '#64748b'"
        >
          {{ month.label }}
        </text>

        <!-- Day labels -->
        <text
          v-for="entry in dayLabelEntries" :key="entry.label" :x="LABEL_MARGIN_LEFT - 4" :y="entry.y" font-size="10"
          text-anchor="end" :fill="isDark ? '#a1a1aa' : '#64748b'"
        >
          {{ entry.label }}
        </text>

        <!-- Cells -->
        <template v-for="(week, wi) in grid.cells" :key="wi">
          <rect
            v-for="(cell, di) in week" :key="di" :x="cell.x" :y="cell.y" :width="CELL_SIZE" :height="CELL_SIZE"
            :fill="cell.inRange ? getColor(cell.count) : 'transparent'" rx="2" ry="2" class="heatmap-cell"
            @mouseenter="showTooltip(cell, $event)" @mouseleave="hideTooltip"
          />
        </template>
      </svg>
    </div>

    <!-- Footer: total + legend -->
    <div class="flex flex-wrap gap-4 items-center justify-between mt-2 text-muted-color text-sm">
      <span>{{ t('ptoj.heatmap_total', { count: totalSubmissions }) }}</span>
      <div class="flex gap-1 items-center">
        <span class="mr-1">{{ t('ptoj.heatmap_less') }}</span>
        <span
          v-for="(level, i) in COLOR_LEVELS" :key="i" :style="{ backgroundColor: getLegendColor(i) }"
          class="inline-block rounded-sm" style="width: 10px; height: 10px;"
        />
        <span class="ml-1">{{ t('ptoj.heatmap_more') }}</span>
      </div>
    </div>

    <!-- Tooltip -->
    <Teleport to="body">
      <Transition name="heatmap-tooltip">
        <div
          v-if="tooltip.visible"
          class="backdrop-blur-xl fixed font-medium px-2 py-1 rounded shadow-lg text-color text-nowrap text-xs z-50"
          :style="{ left: `${tooltip.x + 12}px`, top: `${tooltip.y - 28}px` }"
        >
          {{ tooltip.text }}
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.heatmap-cell {
  transition: opacity 0.15s;
}

.heatmap-cell:hover {
  opacity: 0.75;
  stroke: var(--p-text-color);
  stroke-width: 1;
}
</style>

<style>
.heatmap-tooltip-enter-active,
.heatmap-tooltip-leave-active {
  transition: opacity 0.15s ease;
}

.heatmap-tooltip-enter-from,
.heatmap-tooltip-leave-to {
  opacity: 0;
}
</style>
