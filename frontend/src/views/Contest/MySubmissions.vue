<script setup lang="ts">
import type {
  AccountSubmissionListQuery,
  AccountSubmissionListQueryResult,
  JudgeStatus,
} from '@putongoj/shared'
import { AccountSubmissionListQuerySchema } from '@putongoj/shared'
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import Paginator from 'primevue/paginator'
import Select from 'primevue/select'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { findSubmissions } from '@/api/account'
import SolutionDataTable from '@/components/SolutionDataTable.vue'
import { useContestStore } from '@/store/modules/contest'
import { judgeStatusOptions, languageOptions } from '@/utils/constant'
import emitter from '@/utils/emitter'
import { getJudgeStatusClassname } from '@/utils/formate'
import { onRouteQueryUpdate } from '@/utils/helper'
import { useMessage } from '@/utils/message'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const message = useMessage()

const {
  contestId,
  problemLabels,
  problemOptions,
} = storeToRefs(useContestStore())

const query = ref({} as AccountSubmissionListQuery)
const docs = ref([] as AccountSubmissionListQueryResult['docs'])
const total = ref(0)
const loading = ref(false)

const hasFilter = computed(() => {
  return Boolean(
    query.value.problem
    || Number.isInteger(query.value.judge)
    || query.value.language,
  )
})

async function fetch () {
  const parsed = AccountSubmissionListQuerySchema.safeParse(route.query)
  if (parsed.success) {
    query.value = parsed.data
    query.value.contest = contestId.value
  } else {
    router.replace({ query: {} })
    return
  }

  loading.value = true
  const resp = await findSubmissions(query.value)
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
      contest: undefined,
    },
  })
}

function onPage (event: any) {
  router.replace({
    query: {
      ...route.query,
      page: (event.first / event.rows + 1),
      contest: undefined,
    },
  })
}

function onSearch () {
  router.replace({
    query: {
      ...route.query,
      problem: query.value.problem || undefined,
      judge: Number.isInteger(query.value.judge) ? query.value.judge : undefined,
      language: query.value.language || undefined,
      contest: undefined,
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

function handleViewProblem (data: any) {
  router.push({
    name: 'contestProblem',
    params: {
      contestId: contestId.value,
      problemId: data.pid,
    },
  })
}

emitter.on('submission-updated', (sid) => {
  if (docs.value.some(item => item.sid === sid)) {
    fetch()
  }
})

onMounted(fetch)
onRouteQueryUpdate(fetch)
</script>

<template>
  <div class="p-0">
    <div class="border-b border-surface p-6">
      <div class="gap-4 grid grid-cols-1 items-end lg:grid-cols-3 md:grid-cols-2">
        <Select
          v-model="query.problem" fluid :options="problemOptions" option-label="label" option-value="value"
          show-clear :placeholder="t('ptoj.filter_by_problem')" :disabled="loading" @change="onSearch"
        >
          <template #dropdownicon>
            <i class="pi pi-flag" />
          </template>
        </Select>

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

        <div class="flex gap-2 items-center justify-end lg:col-span-3">
          <Button icon="pi pi-refresh" severity="secondary" outlined :disabled="loading" @click="fetch" />
          <Button
            icon="pi pi-filter-slash" severity="secondary" outlined :disabled="loading || !hasFilter"
            @click="onReset"
          />
          <Button :label="t('ptoj.search')" icon="pi pi-search" :disabled="loading" @click="onSearch" />
        </div>
      </div>
    </div>

    <SolutionDataTable
      class="-mb-px" :value="docs" :loading="loading" :sort-field="query.sortBy"
      :sort-order="query.sort" hide-user hide-contest @sort="onSort"
    >
      <template #problem="{ data }">
        <a @click="handleViewProblem(data)">
          {{ problemLabels.get(data.pid) }}
        </a>
      </template>
    </SolutionDataTable>

    <Paginator
      class="border-surface border-t bottom-0 md:rounded-b-xl overflow-hidden sticky z-10"
      :first="(query.page - 1) * query.pageSize" :rows="query.pageSize" :total-records="total"
      :current-page-report-template="t('ptoj.paginator_report')"
      template="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink" @page="onPage"
    />
  </div>
</template>
