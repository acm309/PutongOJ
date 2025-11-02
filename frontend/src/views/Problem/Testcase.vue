<script lang="ts" setup>
import type {
  ProblemTestcaseCreatePayload,
  ProblemTestcaseListQueryResult,
} from '@putongoj/shared'
import type { TestcasePair } from '@/utils/testcase'
import { TestcaseFileType } from '@putongoj/shared'
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import Divider from 'primevue/divider'
import { useConfirm } from 'primevue/useconfirm'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { createTestcase, findTestcases, removeTestcase } from '@/api/problem'
import TestcaseInput from '@/components/TestcaseInput.vue'
import { useProblemStore } from '@/store/modules/problem'
import { testcaseUrl } from '@/utils/helper'
import { useMessage } from '@/utils/message'

const { t } = useI18n()
const message = useMessage()
const confirm = useConfirm()
const { problem } = storeToRefs(useProblemStore())

const docs = ref<ProblemTestcaseListQueryResult>([])
const testcase = ref({ in: '', out: '' } as Record<TestcaseFileType, string>)
const testcaseInputRef = ref<InstanceType<typeof TestcaseInput> | null>(null)
const testcaseOutputRef = ref<InstanceType<typeof TestcaseInput> | null>(null)
const loading = ref(false)
const importDialog = ref(false)
const importLoading = ref(false)
const parsedTestcases = ref<TestcasePair[]>([])
const fileInputRef = ref<HTMLInputElement>()

const testcaseExportUrl = computed(() => {
  return `/api/problem/${encodeURIComponent(problem.value.pid)}/testcases/export`
})

async function fetchTestcases () {
  loading.value = true
  const resp = await findTestcases(problem.value.pid)
  loading.value = false
  if (!resp.success) {
    message.error(t('ptoj.failed_fetch_testcases'), resp.message)
    return
  }
  docs.value = resp.data
}

function handleDeleteTestcase (item: ProblemTestcaseListQueryResult[number]) {
  confirm.require({
    message: t('ptoj.delete_confirm_message'),
    rejectProps: {
      label: t('ptoj.cancel'),
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: t('ptoj.delete'),
      severity: 'danger',
    },
    accept: async () => {
      loading.value = true
      const resp = await removeTestcase(problem.value.pid, item.uuid)
      loading.value = false

      if (!resp.success) {
        message.error(t('ptoj.failed_delete_testcase'), resp.message)
        return
      }

      message.success(
        t('ptoj.successful_delete_testcase'),
        t('ptoj.successful_delete_testcase_detail', { id: item.uuid.slice(0, 8) }),
      )
      docs.value = resp.data
    },
  })
}

async function handleCreateTestcase () {
  if (!testcase.value.in.trim() && !testcase.value.out.trim()) {
    message.error(t('ptoj.failed_create_testcase'), t('ptoj.testcase_cannot_both_empty'))
    return
  }
  if (!testcase.value.in.trim() || !testcase.value.out.trim()) {
    confirm.require({
      message: t('ptoj.testcase_incomplete_message'),
      rejectProps: {
        label: t('ptoj.cancel'),
        severity: 'secondary',
        outlined: true,
      },
      acceptProps: {
        label: t('ptoj.create'),
      },
      accept: () => createTestcaseRequest(testcase.value),
    })
  } else {
    createTestcaseRequest(testcase.value)
  }
}

async function createTestcaseRequest (testcase: ProblemTestcaseCreatePayload) {
  loading.value = true
  const resp = await createTestcase(problem.value.pid, {
    in: testcase.in.replace(/\r\n/g, '\n'),
    out: testcase.out.replace(/\r\n/g, '\n'),
  })
  loading.value = false

  if (!resp.success) {
    message.error(t('ptoj.failed_create_testcase'), resp.message)
    return
  }

  message.success(t('ptoj.successful_create_testcase'), t('ptoj.successful_create_testcase_detail'))
  docs.value = resp.data
  resetForm()
}

function resetForm () {
  testcaseInputRef.value?.resetForm()
  testcaseOutputRef.value?.resetForm()
}

function handleExportZip () {
  message.info(t('ptoj.exporting_testcases'), t('ptoj.exporting_testcases_detail'))
  window.open(testcaseExportUrl.value, '_self')
}

function handleImportZip () {
  fileInputRef.value?.click()
}

async function onFileSelected (event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    return
  }
  input.value = ''

  message.info(t('ptoj.importing_testcases'), t('ptoj.importing_testcases_detail'))
  try {
    const { TestcaseZipParser } = await import('@/utils/testcase')
    const parser = new TestcaseZipParser(file)
    const pairs = await parser.parse()

    if (pairs.length === 0) {
      message.warn(t('ptoj.failed_import_testcases'), t('ptoj.no_testcases_found_in_zip'))
      return
    }

    parsedTestcases.value = pairs
    importDialog.value = true
  } catch (error) {
    console.error('Failed to parse Zip file:', error)
    message.error(t('ptoj.failed_import_testcases'), t('ptoj.failed_parse_zip_file'))
  }
}

async function confirmImport () {
  if (parsedTestcases.value.length === 0) return

  importLoading.value = true

  let successCount = 0
  let errorCount = 0

  for (const testcase of parsedTestcases.value) {
    try {
      const resp = await createTestcase(problem.value.pid, {
        in: testcase.inputContent.replace(/\r\n/g, '\n'),
        out: testcase.outputContent.replace(/\r\n/g, '\n'),
      })

      if (resp.success) {
        successCount++
      } else {
        errorCount++
        console.warn(`Failed to create testcase ${testcase.inputName}:`, resp.message)
      }
    } catch (error) {
      errorCount++
      console.warn(`Failed to create testcase ${testcase.inputName}:`, error)
    }
  }

  importDialog.value = false
  importLoading.value = false
  parsedTestcases.value = []

  if (errorCount > 0) {
    message.error(
      t('ptoj.failed_import_testcases'),
      t('ptoj.failed_import_testcases_detail', { count: errorCount }),
    )
  }
  if (successCount > 0) {
    message.success(
      t('ptoj.successful_import_testcases'),
      t('ptoj.successful_import_testcases_detail', { count: successCount }),
    )
    await fetchTestcases()
  }
}

function cancelImport () {
  importDialog.value = false
  parsedTestcases.value = []
}

fetchTestcases()
</script>

<template>
  <div class="-mt-6 lg:-mt-11 p-0">
    <div class="border-b border-surface flex flex-wrap gap-4 items-center justify-between p-6">
      <div class="flex font-semibold gap-4 items-center">
        <i class="pi pi-database text-2xl" />
        <h1 class="text-xl">
          {{ t('ptoj.testcases') }}
        </h1>
      </div>
      <div class="flex gap-2">
        <Button
          icon="pi pi-download" :label="t('ptoj.export')" outlined severity="secondary"
          :disabled="docs.length === 0" @click="handleExportZip"
        />
        <Button icon="pi pi-upload" :label="t('ptoj.import')" outlined severity="secondary" @click="handleImportZip" />
        <input ref="fileInputRef" type="file" accept=".zip" class="hidden" @change="onFileSelected">
      </div>
    </div>

    <DataTable :value="docs" :loading="loading">
      <Column field="uuid" class="pl-6">
        <template #header>
          <i class="pi pi-hashtag" />
        </template>
        <template #body="{ data }">
          <span v-tooltip="data.uuid" class="font-mono text-sm">
            {{ data.uuid.slice(0, 8) }}
          </span>
        </template>
      </Column>

      <Column :header="t('ptoj.files')">
        <template #body="{ data }">
          <div class="flex gap-2 items-center">
            <a :href="testcaseUrl(problem.pid, data.uuid, 'in')" target="_blank" class="text-primary">
              {{ t('ptoj.input') }}
            </a>
            <Divider layout="vertical" />
            <a :href="testcaseUrl(problem.pid, data.uuid, 'out')" target="_blank" class="text-primary">
              {{ t('ptoj.output') }}
            </a>
          </div>
        </template>
      </Column>

      <Column class="px-6 py-1 w-20">
        <template #body="{ data }">
          <Button icon="pi pi-trash" severity="danger" text @click="handleDeleteTestcase(data)" />
        </template>
      </Column>

      <template #empty>
        <span class="px-2">
          {{ t('ptoj.empty_content_desc') }}
        </span>
      </template>
    </DataTable>

    <div class="p-6 space-y-4">
      <div class="font-semibold">
        {{ t('ptoj.create_testcase') }}
      </div>

      <TestcaseInput ref="testcaseInputRef" v-model="testcase.in" :type="TestcaseFileType.Input" />
      <TestcaseInput ref="testcaseOutputRef" v-model="testcase.out" :type="TestcaseFileType.Output" />

      <div class="flex justify-end">
        <Button icon="pi pi-plus" :label="t('ptoj.create')" :loading="loading" @click="handleCreateTestcase" />
      </div>
    </div>

    <Dialog
      v-model:visible="importDialog" modal :header="t('ptoj.import_testcases')" :closable="false"
      class="max-w-3xl mx-6 w-full"
    >
      <div class="space-y-4">
        <p>{{ t('ptoj.import_testcases_desc', { count: parsedTestcases.length }) }}</p>

        <DataTable
          :value="parsedTestcases" :rows="5" scrollable scroll-height="400px"
          class="border-surface border-t mt-4"
        >
          <Column :header="t('ptoj.input')" field="inputName">
            <template #body="{ data }">
              <span class="font-mono text-sm">{{ data.inputName }}</span>
            </template>
          </Column>
          <Column :header="t('ptoj.output')" field="outputName">
            <template #body="{ data }">
              <span class="font-mono text-sm">{{ data.outputName }}</span>
            </template>
          </Column>
        </DataTable>
      </div>

      <template #footer>
        <div class="flex gap-2 justify-end">
          <Button
            :label="t('ptoj.cancel')" icon="pi pi-times" severity="secondary" outlined :disabled="importLoading"
            @click="cancelImport"
          />
          <Button :label="t('ptoj.import')" icon="pi pi-check" :loading="importLoading" @click="confirmImport" />
        </div>
      </template>
    </Dialog>
  </div>
</template>
