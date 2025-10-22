<script setup lang="ts">
import { ExportFormat } from '@putongoj/shared'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import IftaLabel from 'primevue/iftalabel'
import Message from 'primevue/message'
import Select from 'primevue/select'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  estimatedCount: number
}>()
const emit = defineEmits<{
  (e: 'export', format: ExportFormat): void
}>()
const visible = defineModel<boolean>('visible')

const { t } = useI18n()
const LARGE_RECORDS_THRESHOLD = 3000

const formatOptions = ref([
  { label: 'JSON (UTF-8)', value: ExportFormat.JSON_UTF8 },
  { label: 'CSV (UTF-8)', value: ExportFormat.CSV_UTF8 },
  { label: 'CSV (UTF-8 with BOM)', value: ExportFormat.CSV_UTF8_BOM },
])
const selectedFormat = ref<ExportFormat>(ExportFormat.CSV_UTF8_BOM)
const exporting = ref(false)

function handleExport () {
  emit('export', selectedFormat.value)
  exporting.value = true
}

watch(visible, (newVal) => {
  if (!newVal) {
    exporting.value = false
  }
})
</script>

<template>
  <Dialog
    v-model:visible="visible" modal :header="t('ptoj.export_data')" :closable="false"
    class="max-w-md mx-6 w-full"
  >
    <div class="space-y-4">
      <p class="text-muted-color">
        {{ t('ptoj.export_data_desc', { count: props.estimatedCount }) }}
      </p>

      <Message v-if="props.estimatedCount === 0" severity="error">
        {{ t('ptoj.export_data_no_records') }}
      </Message>
      <Message v-if="props.estimatedCount >= LARGE_RECORDS_THRESHOLD" severity="warn">
        {{ t('ptoj.export_data_large_records') }}
      </Message>

      <IftaLabel>
        <Select
          id="export-format" v-model="selectedFormat" :options="formatOptions" option-label="label"
          option-value="value" :placeholder="t('ptoj.select_export_format')" fluid
        />
        <label for="export-format" class="block mb-2">{{ t('ptoj.export_format') }}</label>
      </IftaLabel>
    </div>

    <div class="flex gap-2 justify-end mt-5">
      <Button
        type="button" :label="t('ptoj.cancel')" icon="pi pi-times" severity="secondary" outlined
        :disabled="exporting" @click="visible = false"
      />
      <Button
        type="submit" :label="t('ptoj.export')" icon="pi pi-download" :loading="exporting" :disabled="props.estimatedCount === 0 || exporting"
        @click="handleExport"
      />
    </div>
  </Dialog>
</template>
