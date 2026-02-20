<script setup lang="ts">
import type { ProblemStatisticsQueryResult } from '@putongoj/shared'
import { JUDGE_STATUS_TERMINAL } from '@putongoj/shared'
import Chart from 'primevue/chart'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { getProblemStatistics } from '@/api/problem'
import { thousandSeparator } from '@/utils/format'
import { useMessage } from '@/utils/message'

const { t } = useI18n()
const route = useRoute()
const message = useMessage()

const problemId = computed(() => Number.parseInt(route.params.pid as string))

const loading = ref(false)
const judgeCounts = ref([] as ProblemStatisticsQueryResult['judgeCounts'])
const timeDistribution = ref([] as ProblemStatisticsQueryResult['timeDistribution'])
const memoryDistribution = ref([] as ProblemStatisticsQueryResult['memoryDistribution'])

const judgeChartData = computed(() => {
  const judgeCountMap = new Map(judgeCounts.value.map(item => [ item.judge, item.count ]))
  const judgeLabels = [ 'CE', 'AC', 'RE', 'WA', 'TLE', 'MLE', 'OLE', 'PE', 'SE' ]
  const judgeColors = [
    'oklch(70.2% 0.183 293.541)',
    'oklch(70.4% 0.191 22.216)',
    'oklch(70.7% 0.165 254.624)',
    'oklch(76.5% 0.177 163.223)',
    'oklch(85.2% 0.199 91.936)',
    'oklch(78.9% 0.154 211.53)',
    'oklch(85.5% 0.138 181.071)',
    'oklch(83.7% 0.128 66.29)',
    'oklch(86.9% 0.005 56.366)',
  ]

  return {
    labels: judgeLabels,
    datasets: [ {
      data: JUDGE_STATUS_TERMINAL.map(status => judgeCountMap.get(status) ?? 0),
      backgroundColor: judgeColors,
      borderWidth: 2,
      borderRadius: 5,
    } ],
  }
})

const timeChartData = computed(() => {
  const labels = timeDistribution.value.map(bucket =>
    `${thousandSeparator(bucket.lowerBound)}-${thousandSeparator(bucket.upperBound)} ms`)

  return {
    labels,
    datasets: [ {
      data: timeDistribution.value.map(bucket => bucket.count),
      backgroundColor: 'oklch(70.4% 0.191 22.216)',
      borderColor: 'white',
      borderWidth: 2,
      borderRadius: 5,
    } ],
  }
})

const memoryChartData = computed(() => {
  const labels = memoryDistribution.value.map(bucket =>
    `${thousandSeparator(bucket.lowerBound)}-${thousandSeparator(bucket.upperBound)} KB`)

  return {
    labels,
    datasets: [ {
      data: memoryDistribution.value.map(bucket => bucket.count),
      backgroundColor: 'oklch(78.9% 0.154 211.53)',
      borderColor: 'white',
      borderWidth: 2,
      borderRadius: 5,
    } ],
  }
})

const tooltipCallbacks = {
  label (context: any) {
    const value = context.raw || 0
    const total = context.dataset.data.reduce((acc: number, val: number) => acc + val, 0)
    const percentage = total > 0 ? Math.round((value / total) * 100) : 0
    return ` ${thousandSeparator(value)} (${percentage}%)`
  },
}

const doughnutChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: { boxWidth: 12, padding: 15 },
    },
    tooltip: { callbacks: tooltipCallbacks },
  },
}

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: tooltipCallbacks },
  },
}

async function getStatistics () {
  loading.value = true

  judgeCounts.value = []
  timeDistribution.value = []
  memoryDistribution.value = []

  const resp = await getProblemStatistics(problemId.value)
  if (resp.success) {
    judgeCounts.value = resp.data.judgeCounts
    timeDistribution.value = resp.data.timeDistribution
    memoryDistribution.value = resp.data.memoryDistribution
  } else {
    message.error(t('ptoj.failed_fetch_data'), resp.message)
  }

  loading.value = false
}

watch(problemId, getStatistics, { immediate: true })
</script>

<template>
  <div class="p-0">
    <template v-if="loading">
      <div class="flex gap-4 items-center justify-center px-6 py-24">
        <i class="pi pi-spin pi-spinner text-2xl" />
        <span>{{ t('ptoj.loading') }}</span>
      </div>
    </template>

    <template v-else>
      <div class="border-b border-surface p-6">
        <Chart type="doughnut" :data="judgeChartData" :options="doughnutChartOptions" class="h-80 mb-4" />
      </div>

      <div class="border-b border-surface p-6">
        <h3 class="font-semibold mb-4 text-lg">
          {{ t('ptoj.time') }}
        </h3>
        <Chart type="bar" :data="timeChartData" :options="barChartOptions" class="h-80" />
      </div>

      <div class="p-6">
        <h3 class="font-semibold mb-4 text-lg">
          {{ t('ptoj.memory') }}
        </h3>
        <Chart type="bar" :data="memoryChartData" :options="barChartOptions" class="h-80" />
      </div>
    </template>
  </div>
</template>
