<script setup lang="ts">
import type {
  ExportFormat,
  GroupListQueryResult,
  UserRanklistQuery,
  UserRanklistQueryResult,
} from '@putongoj/shared'
import { UserRanklistQuerySchema } from '@putongoj/shared'
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Paginator from 'primevue/paginator'
import Select from 'primevue/select'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { findGroups } from '@/api/group'
import { exportRanklist, findRanklist } from '@/api/user'
import ExportDialog from '@/components/ExportDialog.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import { useSessionStore } from '@/store/modules/session'
import { exportDataToFile } from '@/utils/export'
import { calculatePercentage } from '@/utils/formate'
import { onRouteQueryUpdate } from '@/utils/helper'
import { useMessage } from '@/utils/message'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const message = useMessage()

const { isLogined, isAdmin } = storeToRefs(useSessionStore())
const query = ref({} as UserRanklistQuery)
const docs = ref([] as UserRanklistQueryResult['docs'])
const groups = ref<GroupListQueryResult>([])
const total = ref(0)
const loading = ref(false)
const loadingGroups = ref(false)
const exportDialog = ref(false)

const hasFilter = computed(() => {
  return Boolean(query.value.group)
})

async function fetchGroups () {
  loadingGroups.value = true
  const resp = await findGroups()
  loadingGroups.value = false
  if (!resp.success) {
    message.error(t('ptoj.failed_fetch_groups'), resp.message)
    return
  }
  groups.value = resp.data
  if (query.value.group && !groups.value.find(g => g.gid === query.value.group)) {
    onReset()
  }
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
    },
  })
}

function onSearch () {
  router.replace({
    query: {
      ...route.query,
      group: query.value.group,
      page: undefined,
    },
  })
}

function onReset () {
  router.replace({
    query: {
      ...route.query,
      group: undefined,
      page: undefined,
    },
  })
}

async function onExport (format: ExportFormat) {
  message.info(t('ptoj.exporting_data'), t('ptoj.exporting_data_detail'))
  const resp = await exportRanklist({ group: query.value.group })
  if (!resp.success) {
    message.error(t('ptoj.failed_fetch_ranklist'), resp.message)
    exportDialog.value = false
    return
  }

  const filename = `PutongOJ_Users_Ranklist_${Date.now()}`
  try {
    exportDataToFile(resp.data, filename, format)
  } catch (err: any) {
    message.error(t('ptoj.failed_export_data'), err.message)
  }
  exportDialog.value = false
}

function onView (data: any) {
  router.push({ name: 'UserProfile', params: { uid: data.uid } })
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
          <Button
            v-tooltip.top="!isLogined ? t('ptoj.please_login_first') : (!isAdmin && !hasFilter) ? t('ptoj.please_apply_filter_first') : undefined"
            icon="pi pi-file-export" severity="secondary" outlined
            :disabled="loading || !isLogined || (!isAdmin && !hasFilter)" @click="exportDialog = true"
          />
          <Button icon="pi pi-refresh" severity="secondary" outlined :disabled="loading" @click="fetch" />
          <Button
            icon="pi pi-filter-slash" severity="secondary" outlined :disabled="loading || !hasFilter"
            @click="onReset"
          />
        </div>
      </div>
    </div>

    <DataTable class="-mb-px" :value="docs" :lazy="true" :loading="loading" scrollable>
      <Column class="max-w-18 pl-8 text-center">
        <template #header>
          <span class="text-center w-full">
            <i class="pi pi-hashtag" />
          </span>
        </template>
        <template #body="{ index }">
          {{ index + 1 + (query.page - 1) * query.pageSize }}
        </template>
      </Column>

      <Column field="uid" class="font-medium" frozen>
        <template #header>
          <span class="font-semibold text-center w-full">{{ t('ptoj.user') }}</span>
        </template>
        <template #body="{ data }">
          <span class="cursor-pointer flex gap-2 items-center min-h-10" @click="onView(data)">
            <UserAvatar :image="data.avatar" shape="circle" class="flex-none" />
            <a class="min-w-24">{{ data.uid }}</a>
          </span>
        </template>
      </Column>

      <Column :header="t('ptoj.nickname')" field="nick" class="max-w-48 truncate" />

      <Column :header="t('ptoj.motto')" field="motto" class="min-w-96">
        <template #body="{ data }">
          <span class="-my-px line-clamp-2">
            {{ data.motto.trim() || '' }}
          </span>
        </template>
      </Column>

      <Column field="solve" class="text-center  whitespace-nowrap">
        <template #header>
          <span class="font-semibold text-center w-full">{{ t('ptoj.solved') }}</span>
        </template>
      </Column>

      <Column field="submit" class="text-center  whitespace-nowrap">
        <template #header>
          <span class="font-semibold text-center w-full">{{ t('ptoj.submitted') }}</span>
        </template>
      </Column>

      <Column class="pr-8 text-right">
        <template #header>
          <span class="font-semibold text-center w-full">{{ t('ptoj.ratio') }}</span>
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
      class="border-surface border-t bottom-0 md:rounded-b-xl overflow-hidden sticky z-10"
      :first="(query.page - 1) * query.pageSize" :rows="query.pageSize" :total-records="total"
      template="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
      :current-page-report-template="t('ptoj.paginator_report')" @page="onPage"
    />

    <ExportDialog v-model:visible="exportDialog" :estimated-count="total" @export="onExport" />
  </div>
</template>
