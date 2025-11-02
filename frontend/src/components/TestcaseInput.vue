<script lang="ts" setup>
import type { TestcaseFileType } from '@putongoj/shared'
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage } from '@/utils/message'

const props = defineProps<{
  type: TestcaseFileType
}>()
const value = defineModel<string>()

const { t } = useI18n()
const message = useMessage()

const textInput = ref<string>('')
const fileInput = ref<File | null>(null)
const fileDragOver = ref(false)
const inputFileInput = ref<HTMLInputElement | null>(null)

const fileTypeLabels = computed(() => ({
  in: t('ptoj.input'),
  out: t('ptoj.output'),
} as Record<TestcaseFileType, string>))
const acceptedFileTypes = {
  in: '.in,.txt',
  out: '.out,.txt',
} as Record<TestcaseFileType, string>

function readFileContent (file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error(t('ptoj.invalid_testcase_content')))
        return
      }
      const content = reader.result
      if (!/^[\s\x21-\x7E]*$/.test(content)) {
        reject(new Error(t('ptoj.invalid_testcase_content')))
        return
      }
      resolve(content)
    }
    reader.onerror = () => {
      reject(reader.error)
    }
    reader.readAsText(file)
  })
}

async function preloadFile (file: File) {
  fileInput.value = file
  try {
    const content = await readFileContent(file)
    value.value = content
    textInput.value = ''
  } catch (e: any) {
    message.error(t('ptoj.failed_read_testcase_file'), e.message)
    fileInput.value = null
  }
}

function handleTextareaChange () {
  if (!fileInput.value) {
    value.value = textInput.value
  }
}

function handleFileSelect (event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    preloadFile(input.files[0])
  }
}

function handleDragOver (event: DragEvent) {
  event.preventDefault()
  fileDragOver.value = true
}

function handleDragLeave () {
  fileDragOver.value = false
}

function handleFileDrop (event: DragEvent) {
  event.preventDefault()
  fileDragOver.value = false
  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
    preloadFile(event.dataTransfer.files[0])
  }
}

function removeFile () {
  value.value = ''
  fileInput.value = null
}

function resetForm () {
  fileInput.value = null
  textInput.value = ''
  value.value = ''
}

defineExpose({ resetForm })
</script>

<template>
  <div class="space-y-2" @drop="handleFileDrop($event)" @dragover="handleDragOver($event)" @dragleave="handleDragLeave">
    <div class="flex items-center justify-between">
      <span>{{ fileTypeLabels[props.type] }}</span>
      <div class="flex gap-2">
        <input
          ref="inputFileInput" type="file" :accept="acceptedFileTypes[props.type]" class="hidden"
          @change="handleFileSelect($event)"
        >
        <Button
          icon="pi pi-file-import" :label="t('ptoj.import_file')" severity="secondary" size="small" outlined
          :disabled="fileInput !== null" @click="inputFileInput?.click()"
        />
      </div>
    </div>

    <div v-if="fileInput" class="border border-surface flex gap-2 items-center p-3 rounded-md shadow-xs">
      <i class="m-3 pi pi-file" />
      <span class="flex-1 font-mono">{{ fileInput.name }}</span>
      <Button icon="pi pi-times" severity="danger" text @click="removeFile()" />
    </div>
    <Textarea
      v-else v-model="textInput" class="font-mono" fluid :variant="fileDragOver ? 'filled' : 'outlined'"
      :placeholder="t('ptoj.enter_content_or_drag_file_here')" rows="7" @change="handleTextareaChange"
    />
  </div>
</template>
