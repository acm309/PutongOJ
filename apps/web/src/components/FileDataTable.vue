<script setup lang="ts">
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { useConfirm } from 'primevue/useconfirm'
import { useI18n } from 'vue-i18n'
import { formatBytes, timePretty } from '@/utils/format'
import { useMessage } from '@/utils/message'

interface FileDataTableRow {
  storageKey: string
  originalName: string
  sizeBytes: number
  createdAt: string | Date
  owner?: string
}

const props = withDefaults(defineProps<{
  value: FileDataTableRow[]
  sortField?: string
  sortOrder?: number
  loading?: boolean
  deletingId?: string
  hideUser?: boolean
  enableDownload?: boolean
}>(), {
  sortField: undefined,
  sortOrder: undefined,
  loading: false,
  deletingId: '',
  hideUser: false,
  enableDownload: false,
})

const emit = defineEmits<{
  (e: 'sort', event: any): void
  (e: 'delete', storageKey: string): void
}>()

const { t } = useI18n()
const confirm = useConfirm()
const message = useMessage()

function handleSort (event: any) {
  emit('sort', event)
}

function fileURL (storageKey: string) {
  return `${window.location.origin}/uploads/${storageKey}`
}

async function copyURL (storageKey: string) {
  const url = fileURL(storageKey)
  await navigator.clipboard.writeText(url)
  message.success(t('ptoj.copied'), t('ptoj.file_url_copied'))
}

function downloadFile (storageKey: string) {
  window.open(fileURL(storageKey), '_blank', 'noopener,noreferrer')
}

function confirmDelete (event: Event, storageKey: string) {
  confirm.require({
    target: event.currentTarget as HTMLElement,
    message: t('ptoj.proceed_confirm_message'),
    rejectProps: {
      label: t('ptoj.cancel'),
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: t('ptoj.delete'),
      severity: 'danger',
    },
    accept: () => {
      emit('delete', storageKey)
    },
  })
}
</script>

<template>
  <DataTable
    class="-mb-px whitespace-nowrap" :value="props.value" :lazy="true" :loading="props.loading"
    :sort-field="props.sortField" :sort-order="props.sortOrder" scrollable @sort="handleSort"
  >
    <Column
      v-if="!props.hideUser" field="owner" :header="t('ptoj.user')"
      class="font-medium max-w-36 md:max-w-48 min-w-36 pl-7 truncate"
    >
      <template #body="{ data }">
        <RouterLink :to="{ name: 'UserProfile', params: { uid: data.owner } }">
          <Button class="-my-px justify-start p-0" link fluid :label="String(data.owner ?? '')" />
        </RouterLink>
      </template>
    </Column>

    <Column field="originalName" :header="t('ptoj.file_name')" class="font-medium pl-7" />

    <Column field="sizeBytes" :header="t('ptoj.file_size')" sortable>
      <template #body="{ data }">
        {{ formatBytes(data.sizeBytes) }}
      </template>
    </Column>

    <Column field="createdAt" :header="t('ptoj.created_at')" sortable>
      <template #body="{ data }">
        {{ timePretty(data.createdAt) }}
      </template>
    </Column>

    <Column class="px-6 py-2">
      <template #body="{ data }">
        <div class="flex gap-1 items-center justify-end">
          <Button icon="pi pi-link" text @click="copyURL(data.storageKey)" />
          <Button
            v-if="props.enableDownload" icon="pi pi-download" text
            @click="downloadFile(data.storageKey)"
          />
          <Button
            icon="pi pi-trash" severity="danger" text :loading="props.deletingId === data.storageKey"
            @click="event => confirmDelete(event, data.storageKey)"
          />
        </div>
      </template>
    </Column>

    <template #empty>
      <span class="px-2">
        {{ t('ptoj.empty_content_desc') }}
      </span>
    </template>
  </DataTable>
</template>
