<script setup lang="ts">
import type {
  AccountSubmissionListQuery,
  AccountSubmissionListQueryResult,
  JudgeStatus,
} from '@putong-oj/shared'
import { AccountSubmissionListQuerySchema } from '@putong-oj/shared'
import Button from 'primevue/button'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputNumber from 'primevue/inputnumber'
import Paginator from 'primevue/paginator'
import Select from 'primevue/select'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { findSubmissions } from '@/api/account'
import PageHeader from '@/components/PageHeader.vue'
import SolutionDataTable from '@/components/SolutionDataTable.vue'
import { useDebouncedSearch } from '@/composables/useDebouncedSearch'
import { judgeStatusOptions, languageOptions } from '@/utils/constant'
import emitter from '@/utils/emitter'
import { getJudgeStatusClassname, toOptionalNumber } from '@/utils/format'
import { onRouteQueryUpdate } from '@/utils/helper'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

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

function applySearch () {
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

const {
  searchNow: onSearch,
  searchLater: onSearchInput,
  cancelSearch,
} = useDebouncedSearch(applySearch)

function onProblemInput (event: { value?: string | number }) {
  query.value.problem = toOptionalNumber(event.value)
  onSearchInput()
}

function onContestInput (event: { value?: string | number }) {
  query.value.contest = toOptionalNumber(event.value)
  onSearchInput()
}

function onReset () {
  cancelSearch()
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
    <PageHeader bottom-border icon="pi pi-copy" :title="t('ptoj.my_submissions')">
      <template #toolbar>
        <div class="gap-4 grid grid-cols-1 items-end lg:grid-cols-3 md:grid-cols-2">
          <IconField>
            <InputNumber
              v-model="query.problem" mode="decimal" :min="1" :use-grouping="false" fluid
              :placeholder="t('ptoj.filter_by_problem')" @input="onProblemInput" @keypress.enter="onSearch"
            />
            <InputIcon class="pi pi-flag" />
          </IconField>

          <IconField>
            <InputNumber
              v-model="query.contest" mode="decimal" :min="-1" :use-grouping="false" fluid
              :placeholder="t('ptoj.filter_by_contest')" @input="onContestInput" @keypress.enter="onSearch"
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
          </div>
        </div>
      </template>
    </PageHeader>

    <SolutionDataTable
      class="-mb-px" :value="docs" :loading="loading" :sort-field="query.sortBy"
      :sort-order="query.sort" hide-user @sort="onSort"
    />

    <Paginator
      class="border-surface border-t bottom-0 md:rounded-b-xl overflow-hidden sticky z-10"
      :first="(query.page - 1) * query.pageSize" :rows="query.pageSize" :total-records="total"
      :current-page-report-template="t('ptoj.paginator_report')"
      template="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink" @page="onPage"
    />
  </div>
</template>
