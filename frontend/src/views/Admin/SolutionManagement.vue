<script lang="ts" setup>
import type {
  AdminSolutionListQuery,
  AdminSolutionListQueryResult,
  JudgeStatus,
  Language,
  UserSuggestQueryResult,
} from '@putongoj/shared'
import { AdminSolutionListQuerySchema } from '@putongoj/shared'
import AutoComplete from 'primevue/autocomplete'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputNumber from 'primevue/inputnumber'
import Paginator from 'primevue/paginator'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { findSolutions } from '@/api/admin'
import { suggestUsers } from '@/api/user'
import {
  judgeStatusLabels,
  judgeStatusOptions,
  languageLabels,
  languageOptions,
} from '@/utils/constant'
import {
  getJudgeStatusClassname,
  getSimilarityClassname,
  thousandSeparator,
  timePretty,
} from '@/utils/formate'
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
const userSuggestions = ref([] as UserSuggestQueryResult)
const selectedUser = ref('' as string | UserSuggestQueryResult[number])

async function fetch () {
  const parsed = AdminSolutionListQuerySchema.safeParse(route.query)
  if (parsed.success) {
    query.value = parsed.data
    selectedUser.value = query.value.user || ''
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

async function fetchUsers (event: any) {
  const users = await suggestUsers({ keyword: event.query })
  if (users.success) {
    userSuggestions.value = users.data
  } else {
    userSuggestions.value = []
  }
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
      pageSize: event.rows,
    },
  })
}

function onSearch () {
  router.replace({
    query: {
      ...route.query,
      user: (typeof selectedUser.value === 'string'
        ? selectedUser.value
        : selectedUser.value?.uid) || undefined,
      problem: query.value.problem || undefined,
      contest: query.value.contest || undefined,
      judge: Number.isInteger(query.value.judge) ? query.value.judge : undefined,
      language: query.value.language || undefined,
      page: 1,
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
      page: 1,
    },
  })
}

function onView (data: any) {
  router.push({ name: 'solution', params: { sid: data.sid } })
}
function onViewUser (data: any) {
  router.push({ name: 'UserProfile', params: { uid: data.uid } })
}
function onViewProblem (data: any) {
  router.push({ name: 'problemInfo', params: { pid: data.pid } })
}
function onViewContest (data: any) {
  if (!data.mid || data.mid <= 0) return
  router.push({ name: 'contestOverview', params: { cid: data.mid } })
}

onMounted(fetch)
onRouteQueryUpdate(fetch)
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
        <IconField>
          <AutoComplete
            v-model="selectedUser" fluid :placeholder="t('ptoj.filter_by_user')" option-label="uid"
            :suggestions="userSuggestions" @complete="fetchUsers" @keypress.enter="onSearch" @option-select="onSearch"
          >
            <template #option="{ option }">
              {{ option.uid }} <span v-if="option.nick" class="ml-2 text-muted-color">({{ option.nick }})</span>
            </template>
          </AutoComplete>
          <InputIcon class="pi pi-user" />
        </IconField>

        <IconField>
          <InputNumber
            v-model="query.problem" mode="decimal" :min="1" fluid :placeholder="t('ptoj.filter_by_problem')"
            @keypress.enter="onSearch"
          />
          <InputIcon class="pi pi-flag" />
        </IconField>

        <IconField>
          <InputNumber
            v-model="query.contest" mode="decimal" :min="-1" fluid :placeholder="t('ptoj.filter_by_contest')"
            @keypress.enter="onSearch"
          />
          <InputIcon class="pi pi-trophy" />
        </IconField>

        <Select
          v-model="query.judge" fluid :options="judgeStatusOptions" option-label="label" option-value="value"
          show-clear :placeholder="t('ptoj.filter_by_judge_status')" @change="onSearch"
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
          show-clear :placeholder="t('ptoj.filter_by_language')" @change="onSearch"
        >
          <template #dropdownicon>
            <i class="pi pi-code" />
          </template>
        </Select>

        <div class="flex gap-2 items-center justify-end xl:col-span-3">
          <Button icon="pi pi-refresh" severity="secondary" outlined @click="fetch" />
          <Button icon="pi pi-filter-slash" severity="secondary" outlined @click="onReset" />
          <Button :label="t('ptoj.search')" icon="pi pi-search" @click="onSearch" />
        </div>
      </div>
    </div>

    <DataTable
      v-model:selection="selectedDocs" class="-mb-px whitespace-nowrap" :value="docs" sort-mode="single"
      :sort-field="query.sortBy" data-key="sid" :sort-order="query.sort" :lazy="true" :loading="loading" scrollable
      @sort="onSort"
    >
      <Column selection-mode="multiple" class="pl-6 w-10" frozen />

      <Column field="sid" class="font-medium text-center" frozen>
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

      <Column :header="t('ptoj.user')" field="uid" class="font-medium max-w-36 md:max-w-48 min-w-36 truncate">
        <template #body="{ data }">
          <a @click="onViewUser(data)">
            {{ data.uid }}
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
          <Tag
            v-if="data.sim" severity="secondary" class="-my-px ml-2 text-xs"
            :class="getSimilarityClassname(data.sim)"
          >
            {{ data.sim }}%
          </Tag>
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

      <Column :header="t('ptoj.submitted_at')" field="createdAt" sortable>
        <template #body="{ data }">
          {{ timePretty(data.createdAt) }}
        </template>
      </Column>

      <Column class="px-6 py-1 w-20">
        <template #body="{ data }">
          <div class="flex gap-1 items-center">
            <Button icon="pi pi-eye" text @click="onView(data)" />
          </div>
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
