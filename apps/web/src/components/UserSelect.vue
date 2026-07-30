<script setup lang="ts">
import type { UserSuggestQueryResult } from '@putongoj/shared'
import AutoComplete from 'primevue/autocomplete'
import IftaLabel from 'primevue/iftalabel'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { suggestUsers } from '@/api/user'
import { useMessage } from '@/utils/message'

const props = defineProps<{
  modelValue?: number | null
  label?: string
  placeholder?: string
  disabled?: boolean
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: number | null): void
  (e: 'select'): void
  (e: 'blur'): void
}>()

const { t } = useI18n()
const message = useMessage()

const loading = ref(false)
const users = ref([] as UserSuggestQueryResult)
const selected = ref<number | UserSuggestQueryResult[number] | null>(props.modelValue ?? null)

watch(() => props.modelValue, (val) => {
  if (val !== selected.value) selected.value = val ?? null
})

const value = computed({
  get: () => selected.value,
  set: (val: number | UserSuggestQueryResult[number] | null) => {
    selected.value = val
    emit('update:modelValue', typeof val === 'number' ? val : val?.id ?? null)
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
  <IftaLabel>
    <AutoComplete
      id="user" v-model="value" :suggestions="users" option-label="username" :loading="loading" :disabled="props.disabled"
      :placeholder="props.placeholder || t('ptoj.select_user')" fluid force-selection @complete="fetch"
      @keypress.enter="emit('select')" @option-select="emit('select')" @blur="emit('blur')"
    >
      <template #option="{ option }">
        {{ option.username }}
        <span v-if="option.nickname" class="ml-2 text-muted-color">
          ({{ option.nickname }})
        </span>
      </template>
    </AutoComplete>
    <label for="user">{{ props.label || t('ptoj.user') }}</label>
  </IftaLabel>
</template>
