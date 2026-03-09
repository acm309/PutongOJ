<script setup lang="ts">
import type { ContestParticipantListQuery, ContestParticipantListQueryResult } from '@putongoj/shared'
import { ContestParticipantListQuerySchema, ParticipationStatus } from '@putongoj/shared'
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import InputText from 'primevue/inputtext'
import Paginator from 'primevue/paginator'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { findParticipants, updateParticipantStatus } from '@/api/contest'
import { useContestStore } from '@/store/modules/contest'
import { timePretty } from '@/utils/format'
import { onRouteQueryUpdate } from '@/utils/helper'
import { useMessage } from '@/utils/message'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const message = useMessage()

const { contestId } = storeToRefs(useContestStore())

const query = ref({} as ContestParticipantListQuery)
const docs = ref([] as ContestParticipantListQueryResult['docs'])
const total = ref(0)
const loading = ref(false)
const updatingUsername = ref('')

const statusOptions = computed(() => [
  { label: t('ptoj.participation_status_approved'), value: ParticipationStatus.Approved },
  { label: t('ptoj.participation_status_suspended'), value: ParticipationStatus.Suspended },
])

const hasFilter = computed(() => {
  return Boolean(query.value.user || query.value.status !== undefined)
})

function getStatusLabel (status: ParticipationStatus) {
  if (status === ParticipationStatus.Approved) {
    return t('ptoj.participation_status_approved')
  }
  if (status === ParticipationStatus.Suspended) {
    return t('ptoj.participation_status_suspended')
  }
  return t('ptoj.participation_status_unknown')
}

function getStatusSeverity (status: ParticipationStatus) {
  if (status === ParticipationStatus.Approved) {
    return 'success'
  }
  if (status === ParticipationStatus.Suspended) {
    return 'danger'
  }
  return 'secondary'
}

async function fetch () {
  const parsed = ContestParticipantListQuerySchema.safeParse(route.query)
  if (parsed.success) {
    query.value = parsed.data
  } else {
    router.replace({ query: {} })
    return
  }

  loading.value = true
  const resp = await findParticipants(contestId.value, query.value)
  loading.value = false
  if (!resp.success) {
    message.error(t('ptoj.failed_fetch_participants'), resp.message)
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

function onSort (event: any) {
  router.replace({
    query: {
      ...route.query,
      sortBy: event.sortField,
      sort: event.sortOrder,
    },
  })
}

function onSearch () {
  router.replace({
    query: {
      ...route.query,
      user: query.value.user || undefined,
      status: query.value.status,
      page: undefined,
    },
  })
}

function onReset () {
  router.replace({
    query: {
      ...route.query,
      user: undefined,
      status: undefined,
      page: undefined,
    },
  })
}

async function onUpdateStatus (username: string, status: ParticipationStatus.Approved | ParticipationStatus.Suspended) {
  updatingUsername.value = username
  const resp = await updateParticipantStatus(contestId.value, username, { status })
  updatingUsername.value = ''
  if (!resp.success) {
    message.error(t('ptoj.failed_update_participation_status'), resp.message)
    return
  }

  message.success(t('ptoj.successful_update_participation_status'))
  fetch()
}

onMounted(fetch)
onRouteQueryUpdate(fetch)
</script>

<template>
  <div class="p-0">
    <div class="border-b border-surface p-6">
      <div class="gap-4 grid grid-cols-1 items-end lg:grid-cols-3 md:grid-cols-2">
        <InputText
          v-model="query.user" fluid :placeholder="t('ptoj.filter_by_username_or_nickname')" maxlength="30"
          :disabled="loading" @keypress.enter="onSearch"
        />

        <Select
          v-model="query.status" fluid :options="statusOptions" option-label="label" option-value="value"
          show-clear :placeholder="t('ptoj.filter_by_participation_status')" :disabled="loading" @change="onSearch"
        >
          <template #dropdownicon>
            <i class="pi pi-user-edit" />
          </template>
        </Select>

        <div class="flex gap-2 items-center justify-end">
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
      class="-mb-px whitespace-nowrap" :value="docs" :loading="loading" data-key="username" lazy scrollable
      :sort-field="query.sortBy" :sort-order="query.sort" @sort="onSort"
    >
      <Column field="username" :header="t('ptoj.username')" class="pl-7">
        <template #body="{ data }">
          <RouterLink :to="{ name: 'UserProfile', params: { uid: data.username } }">
            <Button class="border-0 justify-start p-0" link fluid :label="data.username" />
          </RouterLink>
        </template>
      </Column>

      <Column field="nickname" :header="t('ptoj.nickname')" />

      <Column field="status" :header="t('ptoj.participation_status')" class="-my-1" sortable>
        <template #body="{ data }">
          <Tag :value="getStatusLabel(data.status)" :severity="getStatusSeverity(data.status)" />
        </template>
      </Column>

      <Column field="createdAt" :header="t('ptoj.created_at')" sortable>
        <template #body="{ data }">
          {{ timePretty(data.createdAt) }}
        </template>
      </Column>

      <Column field="updatedAt" :header="t('ptoj.updated_at')" sortable>
        <template #body="{ data }">
          {{ timePretty(data.updatedAt) }}
        </template>
      </Column>

      <Column class="pr-6">
        <template #body="{ data }">
          <div class="-my-2 flex gap-2 justify-end">
            <Button
              v-if="data.status !== ParticipationStatus.Approved" icon="pi pi-check" severity="success" text
              :loading="updatingUsername === data.username && data.status !== ParticipationStatus.Approved"
              @click="onUpdateStatus(data.username, ParticipationStatus.Approved)"
            />
            <Button
              v-if="data.status !== ParticipationStatus.Suspended" icon="pi pi-ban" severity="danger" text
              :loading="updatingUsername === data.username && data.status !== ParticipationStatus.Suspended"
              @click="onUpdateStatus(data.username, ParticipationStatus.Suspended)"
            />
          </div>
        </template>
      </Column>
    </DataTable>

    <Paginator
      class="border-surface border-t bottom-0 md:rounded-b-xl overflow-hidden sticky z-10"
      :first="(query.page - 1) * query.pageSize" :rows="query.pageSize" :total-records="total"
      :current-page-report-template="t('ptoj.paginator_report')"
      template="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink" @page="onPage"
    />
  </div>
</template>
