<script lang="ts" setup>
import type {
  GroupListQueryResult,
  UserRanklistQuery,
  UserRanklistQueryResult,
} from '@putongoj/shared'
import { UserRanklistQuerySchema } from '@putongoj/shared'
import pangu from 'pangu'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Paginator from 'primevue/paginator'
import Select from 'primevue/select'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { findGroups } from '@/api/group'
import { findRanklist } from '@/api/user'
import { useRootStore } from '@/store'
import { calculatePercentage } from '@/utils/formate'
import { onRouteQueryUpdate } from '@/utils/helper'
import { useMessage } from '@/utils/message'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const message = useMessage()
const rootStore = useRootStore()
const { judge } = rootStore

const query = ref({} as UserRanklistQuery)
const docs = ref([] as UserRanklistQueryResult['docs'])
const groups = ref<GroupListQueryResult>([])
const total = ref(0)
const loading = ref(false)
const loadingGroups = ref(false)

async function fetchGroups () {
  loadingGroups.value = true
  const resp = await findGroups()
  loadingGroups.value = false
  if (!resp.success) {
    message.error(t('ptoj.failed_fetch_groups'), resp.message)
    return
  }
  groups.value = resp.data
}

async function fetch () {
  const parsed = UserRanklistQuerySchema.safeParse(route.query)
  if (parsed.success) {
    query.value = parsed.data
  } else {
    router.replace({ query: {} })
    return
  }

  loading.value = true
  const resp = await findRanklist(query.value)
  loading.value = false
  if (!resp.success) {
    message.error(t('ptoj.failed_fetch_ranklist'), resp.message)
    docs.value = []
    total.value = 0
    return
  }

  docs.value = resp.data.docs
  total.value = resp.data.total
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
      group: query.value.group,
      page: 1,
    },
  })
}

function onReset () {
  router.replace({
    query: {
      ...route.query,
      group: undefined,
      page: 1,
    },
  })
}

function onView (data: any) {
  router.push({ name: 'UserProfile', params: { uid: data.uid } })
}

function onStatus (data: any, judge?: number) {
  const queryParams: any = { uid: data.uid }
  if (judge !== undefined) {
    queryParams.judge = judge
  }
  router.push({ name: 'status', query: queryParams })
}

onMounted(async () => {
  await Promise.all([ fetchGroups(), fetch() ])
})
onRouteQueryUpdate(fetch)
</script>

<template>
  <div class="max-w-7xl p-0">
    <div class="border-b border-surface p-6">
      <div class="flex font-semibold gap-4 items-center mb-4">
        <i class="pi pi-chart-line text-2xl" />
        <h1 class="text-xl">
          {{ t('ptoj.ranklist') }}
        </h1>
      </div>
      <div class="gap-4 grid grid-cols-1 items-end lg:grid-cols-3 md:grid-cols-2">
        <Select
          v-model="query.group" fluid :options="groups" option-label="title" option-value="gid" show-clear
          :placeholder="t('ptoj.filter_by_group')" :loading="loadingGroups" :disabled="loading" @change="onSearch"
        />

        <div class="flex gap-2 items-center justify-end lg:col-span-2 md:col-span-1">
          <Button icon="pi pi-refresh" severity="secondary" outlined :disabled="loading" @click="fetch" />
          <Button icon="pi pi-filter-slash" severity="secondary" outlined :disabled="loading" @click="onReset" />
        </div>
      </div>
    </div>

    <DataTable class="-mb-px whitespace-nowrap" :value="docs" :lazy="true" :loading="loading" scrollable>
      <Column class="max-w-18 pl-6 text-center">
        <template #header>
          <span class="text-center w-full">
            <i class="pi pi-hashtag" />
          </span>
        </template>
        <template #body="{ index }">
          {{ index + 1 + (query.page - 1) * query.pageSize }}
        </template>
      </Column>

      <Column :header="t('ptoj.username')" field="uid" class="font-medium max-w-36 md:max-w-48 truncate" frozen>
        <template #body="{ data }">
          <a @click="onView(data)">
            {{ data.uid }}
          </a>
        </template>
      </Column>

      <Column :header="t('ptoj.nickname')" field="nick" class="max-w-48 truncate" />

      <Column :header="t('ptoj.motto')" field="motto" class="max-w-72 md:max-w-96 truncate">
        <template #body="{ data }">
          <span class="truncate">{{ pangu.spacing(data.motto || '').trim() }}</span>
        </template>
      </Column>

      <Column field="solve" class="text-center">
        <template #header>
          <span class="font-semibold text-center w-full">{{ t('ptoj.solved') }}</span>
        </template>
        <template #body="{ data }">
          <a @click="onStatus(data, judge.Accepted)">
            {{ data.solve }}
          </a>
        </template>
      </Column>

      <Column field="submit" class="text-center">
        <template #header>
          <span class="font-semibold text-center w-full">{{ t('ptoj.submitted') }}</span>
        </template>
        <template #body="{ data }">
          <a @click="onStatus(data)">
            {{ data.submit }}
          </a>
        </template>
      </Column>

      <Column class="pr-6 text-right">
        <template #header>
          <span class="font-semibold text-right w-full">{{ t('ptoj.ratio') }}</span>
        </template>
        <template #body="{ data }">
          {{ calculatePercentage(data.solve, data.submit) }}
        </template>
      </Column>

      <template #empty>
        <span class="px-2">
          {{ t('ptoj.empty_content_desc') }}
        </span>
      </template>
    </DataTable>

    <Paginator
      class="border-surface border-t bottom-0 sticky"
      :first="(query.page - 1) * query.pageSize" :rows="query.pageSize" :total-records="total"
      template="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
      :current-page-report-template="t('ptoj.paginator_report')" @page="onPage"
    />
  </div>
</template>
