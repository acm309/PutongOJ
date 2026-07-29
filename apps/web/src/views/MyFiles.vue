<script setup lang="ts">
import type { FileListQuery, FileListQueryResult } from '@putongoj/shared'
import { FileListQuerySchema } from '@putongoj/shared'
import { storeToRefs } from 'pinia'
import Message from 'primevue/message'
import MeterGroup from 'primevue/metergroup'
import Paginator from 'primevue/paginator'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { findFiles, removeFile } from '@/api/file'
import FileDataTable from '@/components/FileDataTable.vue'
import { useSessionStore } from '@/store/modules/session'
import { onRouteQueryUpdate } from '@/utils/helper'
import { useMessage } from '@/utils/message'

const route = useRoute()
const router = useRouter()
const sessionStore = useSessionStore()
const { isAdmin } = storeToRefs(sessionStore)
const message = useMessage()
const { t } = useI18n()

const query = ref({} as FileListQuery)
const docs = ref([] as FileListQueryResult['files']['docs'])
const usage = ref({ usedBytes: 0, storageQuota: 0 })
const total = ref(0)
const loading = ref(false)
const deletingId = ref('')

const usageMeterValues = computed(() => [ {
  label: t('ptoj.total_used'),
  value: usage.value.usedBytes,
  color: 'var(--p-primary-color)',
} ])

async function fetch () {
  const parsed = FileListQuerySchema.safeParse(route.query)
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
    message.error(t('ptoj.failed_fetch_files'), resp.message)
    docs.value = []
    total.value = 0
    return
  }

  docs.value = resp.data.files.docs
  total.value = resp.data.files.total
  usage.value = resp.data.usage
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

async function onDelete (storageKey: string) {
  deletingId.value = storageKey
  const resp = await removeFile(storageKey)
  deletingId.value = ''
  if (!resp.success) {
    message.error(t('ptoj.failed_delete_file'), resp.message)
    return
  }

  message.success(t('ptoj.successful_delete_file'), t('ptoj.successful_delete_file_detail', { storageKey }))
  await fetch()
}

onMounted(fetch)
onRouteQueryUpdate(fetch)
</script>

<template>
  <div class="max-w-4xl p-0">
    <div class="border-b border-surface p-6">
      <div class="flex font-semibold gap-4 items-center mb-4">
        <i class="p-[4.5px] pi pi-folder-open text-2xl" />
        <h1 class="text-xl">
          {{ t('ptoj.my_files') }}
        </h1>
      </div>

      <Message v-if="isAdmin" severity="secondary">
        {{ t('ptoj.admin_quota_bypass') }}
      </Message>

      <MeterGroup
        v-else :value="usageMeterValues" :min="0" :max="Math.max(usage.storageQuota, 1)"
        label-position="start"
      />
    </div>

    <FileDataTable
      :value="docs" :loading="loading" :sort-field="query.sortBy" :sort-order="query.sort"
      :deleting-id="deletingId" :hide-user="true" @sort="onSort" @delete="onDelete"
    />

    <Paginator
      class="border-surface border-t bottom-0 md:rounded-b-xl overflow-hidden sticky z-10"
      :first="(query.page - 1) * query.pageSize" :rows="query.pageSize" :total-records="total"
      :current-page-report-template="t('ptoj.paginator_report')"
      template="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink" @page="onPage"
    />
  </div>
</template>
