<script lang="ts" setup>
import type {
  ProblemTestcaseCreatePayload,
  ProblemTestcaseListQueryResult,
} from '@putongoj/shared'
import { TestcaseFileType } from '@putongoj/shared'
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Divider from 'primevue/divider'
import { useConfirm } from 'primevue/useconfirm'
import { ref } from 'vue'
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

fetchTestcases()
</script>

<template>
  <div class="-mt-6 lg:-mt-11 p-0">
    <div class="border-b border-surface flex items-center justify-between p-6">
      <div class="flex font-semibold gap-4 items-center">
        <i class="pi pi-database text-2xl" />
        <h1 class="text-xl">
          {{ t('ptoj.testcases') }}
        </h1>
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
  </div>
</template>
