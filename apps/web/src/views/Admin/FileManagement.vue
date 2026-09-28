<script setup lang="ts">
import type { AdminFileListQuery, AdminFileListQueryResult } from '@putong-oj/shared'
import { AdminFileListQuerySchema } from '@putong-oj/shared'
import Button from 'primevue/button'
import Paginator from 'primevue/paginator'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { findFiles, removeFile } from '@/api/admin'
import FileDataTable from '@/components/FileDataTable.vue'
import PageHeader from '@/components/PageHeader.vue'
import UserFilter from '@/components/UserFilter.vue'
import { useDebouncedSearch } from '@/composables/useDebouncedSearch'
import { onRouteQueryUpdate } from '@/utils/helper'
import { useMessage } from '@/utils/message'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const { t } = useI18n()

const query = ref({} as AdminFileListQuery)
const docs = ref([] as AdminFileListQueryResult['docs'])
const total = ref(0)
const loading = ref(false)
const deletingId = ref('')

async function fetch () {
  const parsed = AdminFileListQuerySchema.safeParse(route.query)
  if (parsed.success) {
    query.value = parsed.data
  } else {
    router.replace({ query: {} })
    return
  }

  loading.value = true
  const resp = await findFiles(query.value)
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
      uploader: query.value.uploader || undefined,
      page: undefined,
    },
  })
}

const {
  searchNow: onSearch,
} = useDebouncedSearch(applySearch)

async function onDelete (storageKey: string) {
  deletingId.value = storageKey
  const resp = await removeFile(storageKey)
  deletingId.value = ''
  if (!resp.success) {
    return
  }

  message.success(t('ptoj.successful_delete_file'), t('ptoj.successful_delete_file_detail', { storageKey }))
  await fetch()
}

onMounted(fetch)
onRouteQueryUpdate(fetch)
</script>

<template>
  <div class="max-w-7xl p-0">
    <PageHeader bottom-border icon="pi pi-folder-open" :title="t('ptoj.file_management')">
      <template #toolbar>
        <div class="gap-4 grid grid-cols-1 items-end lg:grid-cols-3 md:grid-cols-2">
          <UserFilter
            v-model="query.uploader" :disabled="loading" :placeholder="t('ptoj.filter_by_user')"
            force-selection @select="onSearch"
          />

          <div class="flex gap-2 items-center justify-end lg:col-span-2">
            <Button icon="pi pi-refresh" severity="secondary" outlined :disabled="loading" @click="fetch" />
          </div>
        </div>
      </template>
    </PageHeader>

    <FileDataTable
      :value="docs" :loading="loading" :sort-field="query.sortBy" :sort-order="query.sort"
      :deleting-id="deletingId" :enable-download="true" @sort="onSort" @delete="onDelete"
    />

    <Paginator
      class="border-surface border-t bottom-0 md:rounded-b-xl overflow-hidden sticky z-10"
      :first="(query.page - 1) * query.pageSize" :rows="query.pageSize" :total-records="total"
      :current-page-report-template="t('ptoj.paginator_report')"
      template="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink" @page="onPage"
    />
  </div>
</template>
