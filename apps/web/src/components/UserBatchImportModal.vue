<script setup lang="ts">
import type { AdminAccountBatchRegisterPayload } from '@putongoj/shared'
import { passwordRegex, UserModelSchema } from '@putongoj/shared'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { batchRegisterUsers } from '@/api/admin'
import { useMessage } from '@/utils/message'

type SubmitStatus = 'not_submitted' | 'skipped' | 'submitting' | 'success' | 'failed'
type ValidationStatus = 'pending' | 'valid' | 'invalid'

interface ImportRow {
  seq: number
  sheetName: string
  sourceRow: number
  username: string
  password: string
  nick: string
  validationStatus: ValidationStatus
  validationMessage: string
  duplicate: boolean
  submitStatus: SubmitStatus
  submitMessage: string
}

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'refresh'): void
}>()

const message = useMessage()
const { t } = useI18n()

const modalVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value),
})

const fileInput = ref<HTMLInputElement | null>(null)
const fileName = ref('')
const rows = ref<ImportRow[]>([])
const parsing = ref(false)
const submitting = ref(false)
const showPassword = ref(false)

const canSubmitCount = computed(() => {
  return rows.value.filter(row => row.validationStatus === 'valid' && !row.duplicate && row.submitStatus === 'not_submitted').length
})

const submittedCount = computed(() => {
  return rows.value.filter(row => row.submitStatus === 'success' || row.submitStatus === 'failed').length
})

const successCount = computed(() => {
  return rows.value.filter(row => row.submitStatus === 'success').length
})

const failedCount = computed(() => {
  return rows.value.filter(row => row.submitStatus === 'failed').length
})

function clearAll () {
  fileName.value = ''
  rows.value = []
  parsing.value = false
  submitting.value = false
  showPassword.value = false
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

function openFilePicker () {
  fileInput.value?.click()
}

function normalizeHeader (value: string): string {
  return value
    .toLowerCase()
    .replace(/[\s_\-：:]/g, '')
}

function isPasswordComplex (password: string): boolean {
  return password.length >= 8 && passwordRegex.test(password)
}

function toText (value: any): string {
  if (value === null || value === undefined) {
    return ''
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value).trim()
  }
  if (value instanceof Date) {
    return value.toISOString().trim()
  }
  if (typeof value === 'object') {
    if (Array.isArray(value.richText)) {
      return value.richText.map((item: any) => item?.text || '').join('').trim()
    }
    if (typeof value.text === 'string') {
      return value.text.trim()
    }
    if (typeof value.result === 'string' || typeof value.result === 'number') {
      return String(value.result).trim()
    }
    if (typeof value.formula === 'string') {
      return String(value.formula).trim()
    }
  }
  return String(value).trim()
}

function getCellText (row: any, col: number): string {
  return toText(row.getCell(col)?.value)
}

function detectHeaderRow (sheet: any, maxRow: number): number | null {
  const synonymsByColumn = [
    [ '用户名', '账号', 'user', 'username', 'uid' ],
    [ '密码', 'password', 'pwd' ],
    [ '昵称', 'nick', 'nickname' ],
  ].map(group => group.map(normalizeHeader))

  for (let rowNumber = 1; rowNumber <= maxRow; rowNumber += 1) {
    const row = sheet.getRow(rowNumber)
    const values = [ 1, 2, 3 ]
      .map(col => normalizeHeader(getCellText(row, col)))

    const hitCount = values.reduce((count, value, index) => {
      if (!value) {
        return count
      }
      return synonymsByColumn[index].includes(value) ? count + 1 : count
    }, 0)

    const hasCoreHeader = synonymsByColumn[0].includes(values[0]) || synonymsByColumn[1].includes(values[1])
    if (hitCount >= 2 && hasCoreHeader) {
      return rowNumber
    }
  }

  return null
}

function validateRows () {
  const seen = new Map<string, number>()

  for (const row of rows.value) {
    row.validationStatus = 'pending'
    row.validationMessage = ''
    row.duplicate = false
    row.submitStatus = 'not_submitted'
    row.submitMessage = ''

    const errors: string[] = []

    if (!UserModelSchema.shape.uid.safeParse(row.username).success) {
      errors.push(t('ptoj.username_invalid_detail'))
    }

    if (!isPasswordComplex(row.password)) {
      errors.push(t('ptoj.password_weak'))
    }

    if (!UserModelSchema.shape.nick.safeParse(row.nick).success) {
      errors.push(t('ptoj.nickname_invalid'))
    }

    if (errors.length > 0) {
      row.validationStatus = 'invalid'
      row.validationMessage = errors.join('；')
      row.submitStatus = 'skipped'
      row.submitMessage = errors.join('、')
      continue
    }

    const key = row.username.toLowerCase()
    if (seen.has(key)) {
      const firstSeq = seen.get(key)
      row.duplicate = true
      row.validationStatus = 'valid'
      row.validationMessage = t('ptoj.batch_user_import_duplicate_first_seq', { seq: firstSeq })
      row.submitStatus = 'skipped'
      row.submitMessage = t('ptoj.batch_user_import_duplicate_first_seq', { seq: firstSeq })
      continue
    }

    seen.set(key, row.seq)
    row.validationStatus = 'valid'
    row.validationMessage = t('ptoj.success')
    row.submitStatus = 'not_submitted'
    row.submitMessage = t('ptoj.pending')
  }
}

async function parseExcelFile (file: File) {
  parsing.value = true
  try {
    const ExcelJS = await import('exceljs')
    const workbook = new ExcelJS.Workbook()
    const buffer = await file.arrayBuffer()
    await workbook.xlsx.load(buffer)

    const parsedRows: ImportRow[] = []
    let seq = 1

    for (const sheet of workbook.worksheets) {
      const maxRow = Math.max(sheet.actualRowCount || 0, sheet.rowCount || 0)
      if (maxRow <= 0) {
        continue
      }

      const headerRow = detectHeaderRow(sheet, maxRow)
      const startRow = headerRow ? headerRow + 1 : 1

      for (let rowNumber = startRow; rowNumber <= maxRow; rowNumber += 1) {
        const row = sheet.getRow(rowNumber)
        const username = getCellText(row, 1)
        const password = getCellText(row, 2)
        const nick = getCellText(row, 3)

        if ([ username, password, nick ].every(value => value.trim().length === 0)) {
          continue
        }

        parsedRows.push({
          seq,
          sheetName: sheet.name,
          sourceRow: rowNumber,
          username,
          password,
          nick,
          validationStatus: 'pending',
          validationMessage: '',
          duplicate: false,
          submitStatus: 'not_submitted',
          submitMessage: '',
        })
        seq += 1
      }
    }

    rows.value = parsedRows
    validateRows()

    if (rows.value.length === 0) {
      message.warn(t('ptoj.batch_user_import_no_rows_title'), t('ptoj.batch_user_import_no_rows_detail'))
      return
    }

    message.success(
      t('ptoj.success'),
      `${t('ptoj.total')}: ${rows.value.length}, ${t('ptoj.submit')}: ${canSubmitCount.value}`,
    )
  } catch (err: any) {
    rows.value = []
    message.error(
      t('ptoj.failed_parse_excel_file'),
      err?.message || t('ptoj.batch_user_import_parse_failed_detail'),
    )
  } finally {
    parsing.value = false
  }
}

async function onFileChange (event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    return
  }

  fileName.value = file.name
  await parseExcelFile(file)
}

function toPayloadItem (row: ImportRow): AdminAccountBatchRegisterPayload[number] {
  const item: AdminAccountBatchRegisterPayload[number] = {
    username: row.username,
    password: row.password,
  }

  if (row.nick) {
    item.nick = row.nick
  }

  return item
}

function chunkRows<T> (list: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < list.length; i += size) {
    chunks.push(list.slice(i, i + size))
  }
  return chunks
}

async function submitBatchRegister () {
  if (submitting.value) {
    return
  }

  const candidates = rows.value.filter(row => row.validationStatus === 'valid' && !row.duplicate && (row.submitStatus === 'not_submitted' || row.submitStatus === 'failed'))
  if (candidates.length === 0) {
    message.warn(t('ptoj.batch_user_import_no_submit_title'), t('ptoj.batch_user_import_no_submit_detail'))
    return
  }

  submitting.value = true
  try {
    const chunks = chunkRows(candidates, 1000)

    for (const chunk of chunks) {
      for (const row of chunk) {
        row.submitStatus = 'submitting'
        row.submitMessage = t('ptoj.processing')
      }

      const payload = chunk.map(toPayloadItem)
      const resp = await batchRegisterUsers(payload)
      if (!resp.success) {
        for (const row of chunk) {
          row.submitStatus = 'failed'
          row.submitMessage = resp.message || t('ptoj.unknown_error_occurred')
        }
        continue
      }

      const resultByUsername = new Map(
        resp.data.results.map(item => [ item.username.toLowerCase(), item ]),
      )

      for (const row of chunk) {
        const result = resultByUsername.get(row.username.toLowerCase())
        if (!result) {
          row.submitStatus = 'failed'
          row.submitMessage = t('ptoj.unknown_error_occurred')
          continue
        }

        if (result.success) {
          row.submitStatus = 'success'
          row.submitMessage = t('ptoj.success')
        } else {
          row.submitStatus = 'failed'
          row.submitMessage = result.message || t('ptoj.failed')
        }
      }
    }

    message.success(
      t('ptoj.batch_user_import_done_title'),
      `${t('ptoj.success')} ${successCount.value}, ${t('ptoj.failed')} ${failedCount.value}, ${t('ptoj.submit')} ${submittedCount.value}`,
    )
  } finally {
    submitting.value = false
  }
}

function getValidationTagSeverity (row: ImportRow): 'success' | 'danger' | 'secondary' {
  if (row.validationStatus === 'valid') {
    return 'success'
  }
  if (row.validationStatus === 'invalid') {
    return 'danger'
  }
  return 'secondary'
}

function getValidationLabel (row: ImportRow): string {
  if (row.validationStatus === 'valid') {
    return row.duplicate ? `${t('ptoj.success')}(${t('ptoj.skipped')})` : t('ptoj.success')
  }
  if (row.validationStatus === 'invalid') {
    return t('ptoj.failed')
  }
  return t('ptoj.pending')
}

function getSubmitTagSeverity (row: ImportRow): 'success' | 'danger' | 'warn' | 'info' | 'secondary' {
  switch (row.submitStatus) {
    case 'success':
      return 'success'
    case 'failed':
      return 'danger'
    case 'submitting':
      return 'info'
    case 'skipped':
      return 'warn'
    default:
      return 'secondary'
  }
}

function getSubmitLabel (row: ImportRow): string {
  switch (row.submitStatus) {
    case 'success':
      return t('ptoj.success')
    case 'failed':
      return t('ptoj.failed')
    case 'submitting':
      return t('ptoj.processing')
    case 'skipped':
      return t('ptoj.skipped')
    default:
      return t('ptoj.pending')
  }
}

function emitRefresh () {
  emit('refresh')
}
</script>

<template>
  <Dialog
    v-model:visible="modalVisible" modal :closable="true" :close-on-escape="true"
    :header="t('ptoj.batch_user_import')"
    class="w-[80vw]"
    :content-style="{ maxHeight: '72vh', overflow: 'auto' }"
  >
    <div class="flex flex-col gap-4">
      <div class="flex flex-wrap gap-2 items-center">
        <input ref="fileInput" type="file" class="hidden" accept=".xlsx,.xlsm" @change="onFileChange">
        <Button
          icon="pi pi-file-excel" :label="t('ptoj.select_excel_file')" :loading="parsing" :disabled="submitting"
          @click="openFilePicker"
        />
        <Button :icon="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'" severity="secondary" outlined :disabled="rows.length === 0" @click="showPassword = !showPassword" />
        <Button
          icon="pi pi-trash" :label="t('ptoj.clear')" severity="secondary" outlined
          :disabled="rows.length === 0 || parsing || submitting" @click="clearAll"
        />
      </div>

      <div class="flex flex-wrap gap-4 text-sm">
        <span>{{ t('ptoj.total') }}: {{ rows.length }}</span>
        <span>{{ t('ptoj.submit') }}: {{ canSubmitCount }}</span>
        <span>{{ t('ptoj.success') }}: {{ successCount }}</span>
        <span>{{ t('ptoj.failed') }}: {{ failedCount }}</span>
      </div>

      <DataTable :value="rows" data-key="seq" scrollable scroll-height="45vh" striped-rows>
        <Column field="username" :header="t('ptoj.username')" class="min-w-40" />
        <Column field="password" :header="t('ptoj.password')" class="min-w-40">
          <template #body="{ data }">
            <span>{{ showPassword ? data.password : '*'.repeat(Math.min(data.password.length, 16)) }}</span>
          </template>
        </Column>

        <Column field="nick" :header="t('ptoj.nickname')" class="min-w-36" />

        <Column :header="t('ptoj.status')" class="w-28">
          <template #body="{ data }">
            <Tag :value="getValidationLabel(data)" :severity="getValidationTagSeverity(data)" />
          </template>
        </Column>

        <Column :header="t('ptoj.submit')" class="w-28">
          <template #body="{ data }">
            <Tag :value="getSubmitLabel(data)" :severity="getSubmitTagSeverity(data)" />
          </template>
        </Column>

        <Column :header="t('ptoj.message')" class="min-w-56">
          <template #body="{ data }">
            <span>{{ data.submitMessage || data.validationMessage }}</span>
          </template>
        </Column>

        <template #empty>
          <span class="px-2">
            {{ t('ptoj.empty_content_desc') }}
          </span>
        </template>
      </DataTable>

      <div class="flex flex-wrap gap-2 justify-end">
        <Button
          icon="pi pi-refresh" :label="t('ptoj.refresh')" severity="secondary" outlined :disabled="successCount === 0"
          @click="emitRefresh"
        />
        <Button
          icon="pi pi-upload" :label="t('ptoj.submit')" :loading="submitting"
          :disabled="parsing || submitting || canSubmitCount === 0" @click="submitBatchRegister"
        />
      </div>
    </div>
  </Dialog>
</template>
