<script setup lang="ts">
import debounce from 'lodash.debounce'
import { storeToRefs } from 'pinia'
import Message from 'primevue/message'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSolutionStore } from '@/store/modules/solution'
import { language, languagesOrder } from '@/utils/constant'
import { useSolutionStorage } from '@/utils/helper'

const props = defineProps({
  pid: {
    type: String,
    default: '',
  },
})
const { t } = useI18n()
const solutionStore = useSolutionStore()
const { solution } = $(storeToRefs(solutionStore))
const solutionStorage = ref(useSolutionStorage())

const languages = $computed(() =>
  languagesOrder.map(key => ({
    value: key,
    label: language[key],
  })),
)

async function init () {
  solutionStore.clearSavedSolution()
  if (solutionStorage.value[props.pid]) {
    Object.assign(solution, solutionStorage.value[props.pid])
  }
}

watch(
  () => solution,
  debounce((updatedSolution) => {
    solutionStorage.value[props.pid] = updatedSolution
  }, 500),
  { deep: true },
)
watch(() => props.pid, init)

onMounted(init)
onBeforeUnmount(solutionStore.clearSavedSolution)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div>
      <label class="block font-medium mb-1 text-base">Language</label>
      <Select
        v-model="solution.language" :options="languages" option-label="label" option-value="value"
        class="w-full"
      />
    </div>
    <div>
      <Message v-if="solution.language === 3 && !solution.code?.includes('Main')" severity="warn" :closable="false" icon="pi pi-info-circle">
        {{ t('oj.java_class_alert') }}
      </Message>
      <Textarea
        v-model="solution.code" class="code-input" fluid auto-resize rows="15"
        :placeholder="t('oj.paste_your_code')"
      />
    </div>
  </div>
</template>

<style lang="stylus" scoped>
.code-input
  font-family var(--font-code)
</style>
