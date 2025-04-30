<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { onBeforeUnmount, onMounted, watch } from 'vue'
import debounce from 'lodash/debounce'
import { Alert, Form, FormItem, Input, Option, Select } from 'view-ui-plus'
import { useSolutionStore } from '@/store/modules/solution'
import { language } from '@/util/constant'
import { useSolutionStorage } from '@/util/helper'

const props = defineProps({
  pid: {
    type: String,
    default: '',
  },
})
const { t } = useI18n()
const solutionStore = useSolutionStore()
const { solution } = $(storeToRefs(solutionStore))
const solutionStorage = $ref(useSolutionStorage())

const languagesOrder: (keyof typeof language)[] = [ 2, 5, 1, 3, 4 ]
const languages = $computed(() =>
  languagesOrder.map(key => ({
    value: key,
    label: language[key],
  })),
)

async function init () {
  solutionStore.clearSavedSolution()
  if (solutionStorage[props.pid]) {
    Object.assign(solution, solutionStorage[props.pid])
  }
}

watch(
  () => solution,
  debounce((updatedSolution) => {
    solutionStorage[props.pid] = updatedSolution
  }, 500),
  { deep: true },
)
watch(() => props.pid, init)

onMounted(init)
onBeforeUnmount(solutionStore.clearSavedSolution)
</script>

<template>
  <div>
    <Form v-model="solution">
      <FormItem label="Language" label-position="left">
        <Select v-model="solution.language">
          <Option v-for="option in languages" :key="option.value" :value="option.value">
            {{ option.label }}
          </Option>
        </Select>
      </FormItem>
      <FormItem>
        <Alert v-if="solution.language === 3 && !solution.code?.includes('Main')" show-icon>
          {{ t('oj.java_class_alert') }}
        </Alert>
        <Input
          v-model="solution.code" class="code-input" type="textarea" :autosize="{ minRows: 15, maxRows: 20 }"
          :placeholder="t('oj.paste_your_code')"
        />
      </FormItem>
    </Form>
  </div>
</template>

<style lang="stylus" scoped>
.ivu-form-item-label
  font-size: 16px

.code-input
  font-family var(--font-code)
</style>
