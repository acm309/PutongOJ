<script lang="ts" setup>
import type { AdminUsersQuery, AdminUsersQueryResult } from '@putongoj/shared'
import { AdminUsersQuerySchema, UserPrivilege } from '@putongoj/shared'
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
import { getPrivilegeLabel, getPrivilegeSeverity, timePretty } from '@/utils/formate'
import { onRouteQueryUpdate } from '@/utils/helper'
import { useMessage } from '@/utils/message'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const message = useMessage()

const query = ref({} as AdminUsersQuery)
const docs = ref([] as AdminUsersQueryResult['docs'])
const total = ref(0)
const loading = ref(false)

const privilegeOptions = [
  { label: 'Banned', value: UserPrivilege.Banned },
  { label: 'User', value: UserPrivilege.User },
  { label: 'Admin', value: UserPrivilege.Admin },
  { label: 'Root', value: UserPrivilege.Root },
]

async function fetch () {
  const parsed = AdminUsersQuerySchema.safeParse(route.query)
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
    message.error('Failed to fetch users', resp.message)
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
      pageSize: event.rows,
    },
  })
}

function onSearch () {
  router.replace({
    query: {
      ...route.query,
      keyword: query.value.keyword || undefined,
      privilege: query.value.privilege,
      page: 1,
    },
  })
}

function onReset () {
  router.replace({ query: {} })
}

onMounted(fetch)
onRouteQueryUpdate(fetch)
</script>

<template>
  <div class="border border-(--p-content-border-color) max-w-7xl md:rounded-xl mx-auto p-0 shadow-lg">
    <div class="border-(--p-content-border-color) border-b p-6">
      <div class="gap-4 grid grid-cols-1 items-end lg:grid-cols-3 md:grid-cols-2">
        <IconField class="w-full">
          <InputIcon class="pi pi-search text-(--p-text-secondary-color)" />
          <InputText
            v-model="query.keyword" class="w-full" placeholder="Search by username or nickname..."
            @keypress.enter="onSearch"
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

        <div class="flex gap-2 items-center justify-end">
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
      <Column class="font-medium" field="uid" header="Username" sortable frozen />

      <Column class="max-w-48 truncate" field="nick" header="Nickname" />

      <Column field="privilege" header="Privilege">
        <template #body="{ data: { privilege } }">
          <Tag :value="getPrivilegeLabel(privilege)" :severity="getPrivilegeSeverity(privilege)" class="font-medium" />
        </template>
      </Column>

      <Column field="createdAt" header="Created At" sortable>
        <template #body="{ data: { createdAt } }">
          {{ timePretty(createdAt) }}
        </template>
      </Column>

      <Column field="lastVisitedAt" header="Last Visited At" sortable>
        <template #body="{ data: { lastVisitedAt } }">
          {{ lastVisitedAt ? timePretty(lastVisitedAt) : 'Not logged yet' }}
        </template>
      </Column>

      <Column header="Actions" class="w-20">
        <template #body>
          <div class="flex gap-1 items-center">
            <Button icon="pi pi-eye" severity="secondary" text rounded />
            <Button icon="pi pi-pencil" severity="secondary" text rounded />
            <Button icon="pi pi-ellipsis-v" severity="secondary" text rounded />
          </div>
        </template>
      </Column>

      <template #empty>
        {{ t('oj.empty_content') }}
      </template>
    </DataTable>

    <Paginator
      class="border-(--p-content-border-color) border-t bottom-0 sticky"
      :first="(query.page - 1) * query.pageSize" :rows="query.pageSize" :total-records="total"
      template="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
      current-page-report-template="{first} to {last} of {totalRecords}" @page="onPage"
    />
  </div>
</template>
