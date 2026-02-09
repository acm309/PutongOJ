<script setup lang="ts">
import type { Language } from '@putongoj/shared'
import { storeToRefs } from 'pinia'
import Chart from 'primevue/chart'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Paginator from 'primevue/paginator'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useStatisticsStore } from '@/store/modules/statistics'
import { languageLabels } from '@/utils/constant'
import { thousandSeparator, timePretty } from '@/utils/format'
import { onRouteQueryUpdate } from '@/utils/helper'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const statisticsStore = useStatisticsStore()

const { find } = statisticsStore
const { list, countList, sumStatis } = storeToRefs(statisticsStore)

const pid = computed(() => Number.parseInt(route.params.pid as string))
const pageSize = computed(() => Number.parseInt(route.query.pageSize as string) || 20)
const currentPage = computed(() => Number.parseInt(route.query.page as string) || 1)

const loading = ref(false)

const chartData = computed(() => {
  return {
    labels: [ 'CE', 'AC', 'RE', 'WA', 'TLE', 'MLE', 'OLE', 'PE', 'SE' ],
    datasets: [ {
      data: [
        countList.value[0] || 0,
        countList.value[1] || 0,
        countList.value[2] || 0,
        countList.value[3] || 0,
        countList.value[4] || 0,
        countList.value[5] || 0,
        countList.value[6] || 0,
        countList.value[7] || 0,
        countList.value[8] || 0,
      ],
      backgroundColor: [
        'oklch(70.2% 0.183 293.541)',
        'oklch(70.4% 0.191 22.216)',
        'oklch(70.7% 0.165 254.624)',
        'oklch(76.5% 0.177 163.223)',
        'oklch(85.2% 0.199 91.936)',
        'oklch(78.9% 0.154 211.53)',
        'oklch(85.5% 0.138 181.071)',
        'oklch(83.7% 0.128 66.29)',
        'oklch(86.9% 0.005 56.366)',
      ],
      borderWidth: 2,
      borderRadius: 5,
    } ],
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        boxWidth: 12,
        padding: 15,
      },
    },
    tooltip: {
      callbacks: {
        label (context: any) {
          const value = context.raw || 0
          const total = context.dataset.data.reduce((acc: number, val: number) => acc + val, 0)
          const percentage = total > 0 ? Math.round((value / total) * 100) : 0
          return ` ${value} (${percentage}%)`
        },
      },
    },
  },
}

async function getStatistics () {
  loading.value = true
  await find({
    page: currentPage.value,
    pageSize: pageSize.value,
    pid: pid.value,
  })
  loading.value = false
}

function onPage (event: any) {
  router.replace({
    query: {
      ...route.query,
      page: (event.first / event.rows + 1),
    },
  })
}

onMounted(getStatistics)
onRouteQueryUpdate(getStatistics)
</script>

<template>
  <div class="-mt-4 p-0">
    <Chart type="doughnut" :data="chartData" :options="chartOptions" class="h-80 mb-8" />

    <DataTable class="whitespace-nowrap" :value="list" data-key="sid" :lazy="true" :loading="loading" scrollable>
      <Column field="sid" class="font-medium pl-6 text-center" frozen>
        <template #header>
          <span class="text-center w-full">
            <i class="pi pi-hashtag" />
          </span>
        </template>
        <template #body="{ data }">
          <RouterLink :to="{ name: 'solution', params: { sid: data.sid } }">
            {{ data.sid }}
          </RouterLink>
        </template>
      </Column>

      <Column :header="t('ptoj.user')" field="uid" class="font-medium max-w-36 md:max-w-48 min-w-36 truncate">
        <template #body="{ data }">
          <RouterLink :to="{ name: 'UserProfile', params: { uid: data.uid } }">
            {{ data.uid }}
          </RouterLink>
        </template>
      </Column>

      <Column field="time" class="text-right">
        <template #header>
          <span class="font-semibold text-right w-full">
            {{ t('ptoj.time') }}
          </span>
        </template>
        <template #body="{ data }">
          {{ thousandSeparator(data.time) }} <small>ms</small>
        </template>
      </Column>

      <Column field="memory" class="text-right">
        <template #header>
          <span class="font-semibold text-right w-full">
            {{ t('ptoj.memory') }}
          </span>
        </template>
        <template #body="{ data }">
          {{ thousandSeparator(data.memory) }} <small>KB</small>
        </template>
      </Column>

      <Column field="language" class="text-center">
        <template #header>
          <span class="font-semibold text-center w-full">
            {{ t('ptoj.language') }}
          </span>
        </template>
        <template #body="{ data }">
          {{ languageLabels[data.language as Language] }}
        </template>
      </Column>

      <Column :header="t('ptoj.submitted_at')" field="createdAt" class="pr-6">
        <template #body="{ data }">
          {{ timePretty(data.create) }}
        </template>
      </Column>

      <template #empty>
        <span class="px-2">
          {{ t('ptoj.empty_content_desc') }}
        </span>
      </template>
    </DataTable>

    <Paginator
      class="border-surface border-t bottom-0 md:rounded-b-xl overflow-hidden sticky z-10"
      :first="(currentPage - 1) * pageSize" :rows="pageSize" :total-records="sumStatis"
      :current-page-report-template="t('ptoj.paginator_report')"
      template="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink" @page="onPage"
    />
  </div>
</template>
