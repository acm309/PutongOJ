<script lang="ts" setup>
import type { AdminUserListQuery, AdminUserListQueryResult } from '@putongoj/shared'
import { AdminUserListQuerySchema } from '@putongoj/shared'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Paginator from 'primevue/paginator'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { findUsers } from '@/api/admin'
import { privilegeOptions } from '@/utils/constant'
import { getPrivilegeLabel, getPrivilegeSeverity, timePretty } from '@/utils/formate'
import { onRouteQueryUpdate } from '@/utils/helper'
import { useMessage } from '@/utils/message'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const message = useMessage()

const query = ref({} as AdminUserListQuery)
const docs = ref([] as AdminUserListQueryResult['docs'])
const total = ref(0)
const loading = ref(false)

async function fetch () {
  const parsed = AdminUserListQuerySchema.safeParse(route.query)
  if (parsed.success) {
    query.value = parsed.data
  } else {
    router.replace({ query: {} })
    return
  }

  loading.value = true
  const resp = await findUsers(query.value)
  loading.value = false
  if (!resp.success) {
    message.error('Failed to fetch user list', resp.message)
    docs.value = []
    total.value = 0
    return
  }

  docs.value = resp.data.docs
  total.value = resp.data.total
}

function onSort (event: any) {
  router.replace({ query: {
    ...route.query,
    sortBy: event.sortField,
    sort: event.sortOrder,
  } })
}

function onPage (event: any) {
  router.replace({ query: {
    ...route.query,
    page: (event.first / event.rows + 1),
    pageSize: event.rows,
  } })
}

function onSearch () {
  router.replace({ query: {
    ...route.query,
    keyword: query.value.keyword || undefined,
    privilege: query.value.privilege,
    page: 1,
  } })
}

function onReset () {
  router.replace({ query: {
    ...route.query,
    keyword: undefined,
    privilege: undefined,
    page: 1,
  } })
}

function onView (data: any) {
  router.push({ name: 'userProfile', params: { uid: data.uid } })
}

function onEdit (data: any) {
  router.push({ name: 'UserManagementDetail', params: { uid: data.uid } })
}

onMounted(fetch)
onRouteQueryUpdate(fetch)
</script>

<template>
  <div class="max-w-7xl p-0">
    <div class="border-b border-surface p-6">
      <div class="flex font-semibold gap-4 items-center mb-4">
        <i class="pi pi-users text-2xl" />
        <h1 class="text-xl">
          User Management
        </h1>
      </div>
      <div class="gap-4 grid grid-cols-1 items-end lg:grid-cols-3 md:grid-cols-2">
        <IconField class="w-full">
          <InputIcon class="pi pi-search text-(--p-text-secondary-color)" />
          <InputText
            v-model="query.keyword" class="w-full" placeholder="Search by username or nickname..."
            maxlength="30" @keypress.enter="onSearch"
          />
        </IconField>

        <Select
          v-model="query.privilege" class="w-full" :options="privilegeOptions" option-label="label"
          option-value="value" show-clear placeholder="All privileges"
        >
          <template #option="slotProps">
            <Tag
              :value="getPrivilegeLabel(slotProps.option.value)"
              :severity="getPrivilegeSeverity(slotProps.option.value)"
            />
          </template>
        </Select>

        <div class="flex gap-2 items-center justify-end lg:col-span-1 md:col-span-2">
          <Button icon="pi pi-refresh" severity="secondary" outlined @click="fetch" />
          <Button icon="pi pi-filter-slash" severity="secondary" outlined @click="onReset" />
          <Button label="Search" icon="pi pi-search" @click="onSearch" />
        </div>
      </div>
    </div>

    <DataTable
      class="-mb-px whitespace-nowrap" :value="docs" sort-mode="single" :sort-field="query.sortBy"
      :sort-order="query.sort" :lazy="true" :loading="loading" scrollable @sort="onSort" @page="onPage"
    >
      <Column header="Username" field="uid" class="font-medium max-w-48 pl-6 truncate" sortable frozen />

      <Column header="Nickname" field="nick" class="max-w-48 truncate" />

      <Column header="Privilege" field="privilege">
        <template #body="{ data }">
          <Tag :value="getPrivilegeLabel(data.privilege)" :severity="getPrivilegeSeverity(data.privilege)" />
        </template>
      </Column>

      <Column header="Created At" field="createdAt" sortable>
        <template #body="{ data }">
          <span class="font-mono">
            {{ timePretty(data.createdAt) }}
          </span>
        </template>
      </Column>

      <Column header="Last Visited At" field="lastVisitedAt" sortable>
        <template #body="{ data }">
          <span class="font-mono">
            {{ data.lastVisitedAt ? timePretty(data.lastVisitedAt) : 'Unknown' }}
          </span>
        </template>
      </Column>

      <Column class="pr-6 py-2 w-20">
        <template #body="{ data }">
          <div class="flex gap-1 items-center">
            <Button icon="pi pi-eye" text @click="onView(data)" />
            <Button icon="pi pi-pencil" text @click="onEdit(data)" />
          </div>
        </template>
      </Column>

      <template #empty>
        {{ t('oj.empty_content') }}
      </template>
    </DataTable>

    <Paginator
      class="border-surface border-t bottom-0 sticky"
      :first="(query.page - 1) * query.pageSize" :rows="query.pageSize" :total-records="total"
      template="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
      current-page-report-template="{first} to {last} of {totalRecords}" @page="onPage"
    />
  </div>
</template>
