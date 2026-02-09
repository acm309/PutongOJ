<script setup lang="ts">
import type {
  AdminSolutionListQuery,
  AdminSolutionListQueryResult,
  ExportFormat,
  JudgeStatus,
} from '@putongoj/shared'
import { AdminSolutionListQuerySchema } from '@putongoj/shared'
import Button from 'primevue/button'
import ButtonGroup from 'primevue/buttongroup'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputNumber from 'primevue/inputnumber'
import Paginator from 'primevue/paginator'
import Select from 'primevue/select'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { exportSolutions, findSolutions } from '@/api/admin'
import ExportDialog from '@/components/ExportDialog.vue'
import SolutionDataTable from '@/components/SolutionDataTable.vue'
import UserFilter from '@/components/UserFilter.vue'
import { judgeStatusOptions, languageOptions } from '@/utils/constant'
import { exportDataToFile } from '@/utils/export'
import { getJudgeStatusClassname } from '@/utils/format'
import { onRouteQueryUpdate } from '@/utils/helper'
import { useMessage } from '@/utils/message'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const message = useMessage()

const query = ref({} as AdminSolutionListQuery)
const docs = ref([] as AdminSolutionListQueryResult['docs'])
const total = ref(0)
const loading = ref(false)
const selectedDocs = ref([] as AdminSolutionListQueryResult['docs'])
const exportDialog = ref(false)
const autoRefresh = ref<number | null>(null)

const hasFilter = computed(() => {
  return Boolean(
    query.value.user
    || query.value.problem
    || query.value.contest
    || Number.isInteger(query.value.judge)
    || query.value.language,
  )
})

async function fetch () {
  const parsed = AdminSolutionListQuerySchema.safeParse(route.query)
  if (parsed.success) {
    query.value = parsed.data
  } else {
    router.replace({ query: {} })
    return
  }

  loading.value = true
  const resp = await findSolutions(query.value)
  loading.value = false
  if (!resp.success) {
    message.error(t('ptoj.failed_fetch_solutions'), resp.message)
    docs.value = []
    total.value = 0
    return
  }

  docs.value = resp.data.docs
  total.value = resp.data.total
}

function onSort (event: any) {
  router.replace({
    query: {
      ...route.query,
      sortBy: event.sortField,
      sort: event.sortOrder,
    },
  })
}

function onPage (event: any) {
  router.replace({
    query: {
      ...route.query,
      page: (event.first / event.rows + 1),
    },
  })
}

function onSearch () {
  router.replace({
    query: {
      ...route.query,
      user: query.value.user || undefined,
      problem: query.value.problem || undefined,
      contest: query.value.contest || undefined,
      judge: Number.isInteger(query.value.judge) ? query.value.judge : undefined,
      language: query.value.language || undefined,
      page: undefined,
    },
  })
}

function onReset () {
  router.replace({
    query: {
      ...route.query,
      user: undefined,
      problem: undefined,
      contest: undefined,
      judge: undefined,
      language: undefined,
      page: undefined,
    },
  })
}

async function onExport (format: ExportFormat) {
  message.info(t('ptoj.exporting_data'), t('ptoj.exporting_data_detail'))
  const resp = await exportSolutions(query.value)
  if (!resp.success) {
    message.error(t('ptoj.failed_fetch_solutions'), resp.message)
    exportDialog.value = false
    return
  }

  const filename = `PutongOJ_Solutions_${Date.now()}`
  try {
    exportDataToFile(resp.data, filename, format)
  } catch (err: any) {
    message.error(t('ptoj.failed_export_data'), err.message)
  }
  exportDialog.value = false
}

function clearAutoRefresh () {
  if (autoRefresh.value) {
    clearInterval(autoRefresh.value)
    autoRefresh.value = null
  }
}

function toggleAutoRefresh () {
  if (autoRefresh.value) {
    clearAutoRefresh()
  } else {
    autoRefresh.value = window.setInterval(() => {
      fetch()
    }, 10000)
  }
}

onMounted(fetch)
onRouteQueryUpdate(fetch)
onBeforeUnmount(clearAutoRefresh)
</script>

<template>
  <div class="max-w-[1440px] p-0">
    <div class="border-b border-surface p-6">
      <div class="flex font-semibold gap-4 items-center mb-4">
        <i class="pi pi-copy text-2xl" />
        <h1 class="text-xl">
          {{ t('ptoj.solution_management') }}
        </h1>
      </div>
      <div class="gap-4 grid grid-cols-1 items-end lg:grid-cols-3 md:grid-cols-2 xl:grid-cols-4">
        <UserFilter v-model="query.user" :disabled="loading" @select="onSearch" />

        <IconField>
          <InputNumber
            v-model="query.problem" mode="decimal" :min="1" fluid :use-grouping="false"
            :placeholder="t('ptoj.filter_by_problem')" :disabled="loading" @keypress.enter="onSearch"
          />
          <InputIcon class="pi pi-flag" />
        </IconField>

        <IconField>
          <InputNumber
            v-model="query.contest" mode="decimal" :min="-1" fluid :use-grouping="false"
            :placeholder="t('ptoj.filter_by_contest')" :disabled="loading" @keypress.enter="onSearch"
          />
          <InputIcon class="pi pi-trophy" />
        </IconField>

        <Select
          v-model="query.judge" fluid :options="judgeStatusOptions" option-label="label" option-value="value"
          show-clear :placeholder="t('ptoj.filter_by_judge_status')" :disabled="loading" @change="onSearch"
        >
          <template #option="slotProps">
            <div :class="getJudgeStatusClassname(slotProps.option.value as JudgeStatus)">
              {{ slotProps.option.label }}
            </div>
          </template>
          <template #dropdownicon>
            <i class="pi pi-check-square" />
          </template>
        </Select>

        <Select
          v-model="query.language" fluid :options="languageOptions" option-label="label" option-value="value"
          show-clear :placeholder="t('ptoj.filter_by_language')" :disabled="loading" @change="onSearch"
        >
          <template #dropdownicon>
            <i class="pi pi-code" />
          </template>
        </Select>

        <div class="flex gap-2 items-center justify-end xl:col-span-3">
          <Button
            icon="pi pi-file-export" severity="secondary" outlined :disabled="loading"
            @click="exportDialog = true"
          />
          <ButtonGroup>
            <Button icon="pi pi-refresh" severity="secondary" outlined :disabled="loading" @click="fetch" />
            <Button
              v-tooltip.bottom="t('ptoj.auto_refresh')" :icon="autoRefresh ? 'pi pi-stop' : 'pi pi-play'"
              :severity="autoRefresh ? 'primary' : 'secondary'" outlined :disabled="loading" @click="toggleAutoRefresh"
            />
          </ButtonGroup>
          <Button
            icon="pi pi-filter-slash" severity="secondary" outlined :disabled="loading || !hasFilter"
            @click="onReset"
          />
          <Button :label="t('ptoj.search')" icon="pi pi-search" :disabled="loading" @click="onSearch" />
        </div>
      </div>
    </div>

    <SolutionDataTable
      v-model:selection="selectedDocs" class="-mb-px" :value="docs" :loading="loading"
      :sort-field="query.sortBy" :sort-order="query.sort" selectable @sort="onSort"
    />

    <Paginator
      class="border-surface border-t bottom-0 md:rounded-b-xl overflow-hidden sticky z-10"
      :first="(query.page - 1) * query.pageSize" :rows="query.pageSize" :total-records="total"
      :current-page-report-template="t('ptoj.paginator_report')"
      template="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink" @page="onPage"
    />

    <ExportDialog v-model:visible="exportDialog" :estimated-count="total" @export="onExport" />
  </div>
</template>
