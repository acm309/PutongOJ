<script setup lang="ts">
import type { UserSuggestQueryResult } from '@putongoj/shared'
import AutoComplete from 'primevue/autocomplete'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { suggestUsers } from '@/api/user'
import { useMessage } from '@/utils/message'

const props = defineProps<{
  modelValue?: string
  disabled?: boolean
  placeholder?: string
  forceSelection?: boolean
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'select'): void
}>()

const { t } = useI18n()
const message = useMessage()

const loading = ref(false)
const users = ref([] as UserSuggestQueryResult)
const selected = ref(props.modelValue || '')

watch(() => props.modelValue, (val) => {
  if (val !== selected.value) selected.value = val || ''
})

const value = computed({
  get: () => selected.value,
  set: (val: string | UserSuggestQueryResult[number] | null) => {
    selected.value = typeof val === 'string' ? val : val?.uid || ''
    emit('update:modelValue', selected.value)
  },
})

async function fetch (event: any) {
  loading.value = true
  const resp = await suggestUsers({ keyword: event.query })
  if (!resp.success) {
    users.value = []
    message.error(t('ptoj.failed_fetch_users'), resp.message)
  } else {
    users.value = resp.data
  }
  loading.value = false
}
</script>

<template>
  <IconField>
    <AutoComplete
      v-model="value" :suggestions="users" option-label="uid" :disabled="props.disabled" :loading="loading"
      :placeholder="props.placeholder || t('ptoj.filter_by_user')" fluid :force-selection="props.forceSelection"
      @complete="fetch" @keypress.enter="emit('select')" @option-select="emit('select')"
    >
      <template #option="{ option }">
        {{ option.uid }}
        <span v-if="option.nick" class="ml-2 text-muted-color">
          ({{ option.nick }})
        </span>
      </template>
    </AutoComplete>
    <InputIcon v-show="!loading" class="pi pi-user" />
  </IconField>
</template>
