<script lang="ts" setup>
import type {
  AccountSubmissionListQuery,
  AccountSubmissionListQueryResult,
  JudgeStatus,
  Language,
} from '@putongoj/shared'
import { AccountSubmissionListQuerySchema } from '@putongoj/shared'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputNumber from 'primevue/inputnumber'
import Paginator from 'primevue/paginator'
import Select from 'primevue/select'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { findSubmissions } from '@/api/account'
import {
  judgeStatusLabels,
  judgeStatusOptions,
  languageLabels,
  languageOptions,
} from '@/utils/constant'
import emitter from '@/utils/emitter'
import {
  getJudgeStatusClassname,
  thousandSeparator,
  timePretty,
} from '@/utils/formate'
import { onRouteQueryUpdate } from '@/utils/helper'
import { useMessage } from '@/utils/message'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const message = useMessage()

const query = ref({} as AccountSubmissionListQuery)
const docs = ref([] as AccountSubmissionListQueryResult['docs'])
const total = ref(0)
const loading = ref(false)

const hasFilter = computed(() => {
  return Boolean(
    query.value.problem
    || query.value.contest
    || Number.isInteger(query.value.judge)
    || query.value.language,
  )
})

async function fetch () {
  const parsed = AccountSubmissionListQuerySchema.safeParse(route.query)
  if (parsed.success) {
    query.value = parsed.data
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

function onView (data: any) {
  router.push({ name: 'solution', params: { sid: data.sid } })
}
function onViewProblem (data: any) {
  router.push({ name: 'problemInfo', params: { pid: data.pid } })
}
function onViewContest (data: any) {
  if (!data.mid || data.mid <= 0) return
  router.push({ name: 'contestOverview', params: { cid: data.mid } })
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
  <div class="max-w-6xl p-0">
    <div class="border-b border-surface p-6">
      <div class="flex font-semibold gap-4 items-center mb-4">
        <i class="pi pi-copy text-2xl" />
        <h1 class="text-xl">
          {{ t('ptoj.my_submissions') }}
        </h1>
      </div>
      <div class="gap-4 grid grid-cols-1 items-end lg:grid-cols-3 md:grid-cols-2">
        <IconField>
          <InputNumber
            v-model="query.problem" mode="decimal" :min="1" :use-grouping="false" fluid
            :placeholder="t('ptoj.filter_by_problem')" :disabled="loading" @keypress.enter="onSearch"
          />
          <InputIcon class="pi pi-flag" />
        </IconField>

        <IconField>
          <InputNumber
            v-model="query.contest" mode="decimal" :min="-1" :use-grouping="false" fluid
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

        <div class="flex gap-2 items-center justify-end md:col-span-2 xl:col-span-2">
          <Button icon="pi pi-refresh" severity="secondary" outlined :disabled="loading" @click="fetch" />
          <Button
            icon="pi pi-filter-slash" severity="secondary" outlined :disabled="loading || !hasFilter"
            @click="onReset"
          />
          <Button :label="t('ptoj.search')" icon="pi pi-search" :disabled="loading" @click="onSearch" />
        </div>
      </div>
    </div>

    <DataTable
      class="-mb-px whitespace-nowrap" :value="docs" sort-mode="single" :sort-field="query.sortBy"
      data-key="sid" :sort-order="query.sort" :lazy="true" :loading="loading" scrollable @sort="onSort"
    >
      <Column field="sid" class="font-medium pl-6 text-center" frozen>
        <template #header>
          <span class="text-center w-full">
            <i class="pi pi-hashtag" />
          </span>
        </template>
        <template #body="{ data }">
          <a @click="onView(data)">
            {{ data.sid }}
          </a>
        </template>
      </Column>

      <Column field="pid" class="text-center">
        <template #header>
          <span class="font-semibold text-center w-full">
            {{ t('ptoj.problem') }}
          </span>
        </template>
        <template #body="{ data }">
          <a @click="onViewProblem(data)">
            {{ data.pid }}
          </a>
        </template>
      </Column>

      <Column field="mid" class="text-center">
        <template #header>
          <span class="font-semibold text-center w-full">
            {{ t('ptoj.contest') }}
          </span>
        </template>
        <template #body="{ data }">
          <a v-if="data.mid && data.mid > 0" @click="onViewContest(data)">
            {{ data.mid }}
          </a>
          <span v-else>
            -
          </span>
        </template>
      </Column>

      <Column :header="t('ptoj.judge_status')" field="judge">
        <template #body="{ data }">
          <span :class="getJudgeStatusClassname(data.judge as JudgeStatus)">
            {{ judgeStatusLabels[data.judge as JudgeStatus] }}
          </span>
        </template>
      </Column>

      <Column field="time" class="text-right" sortable>
        <template #header>
          <span class="font-semibold text-right w-full">
            {{ t('ptoj.time') }}
          </span>
        </template>
        <template #body="{ data }">
          {{ thousandSeparator(data.time) }} <small>ms</small>
        </template>
      </Column>

      <Column field="memory" class="text-right" sortable>
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

      <Column :header="t('ptoj.submitted_at')" field="createdAt" class="pr-6" sortable>
        <template #body="{ data }">
          {{ timePretty(data.createdAt) }}
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
      :first="(query.page - 1) * query.pageSize" :rows="query.pageSize" :total-records="total"
      :current-page-report-template="t('ptoj.paginator_report')"
      template="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink" @page="onPage"
    />
  </div>
</template>
