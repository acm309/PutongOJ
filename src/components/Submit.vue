<script setup>
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import constant from '@/util/constant'
import { useSolutionStore } from '@/store/modules/solution'

const { t } = useI18n()
const solutionStore = useSolutionStore()
const { solution } = $(storeToRefs(solutionStore))
const language = $ref(constant.language)
// Clear the saved solution in case of the user visits this page after
// they viewed other's solution.
solutionStore.clearSavedSolution()
</script>

<template>
  <div>
    <Form v-model="solution">
      <FormItem label="Language" label-position="left">
        <Select v-model="solution.language">
          <Option :value="2">{{ language[2] }}</Option>
          <Option :value="5">{{ language[5] }}</Option>
          <Option :value="1">{{ language[1] }}</Option>
          <Option :value="3">{{ language[3] }}</Option>
          <Option :value="4">{{ language[4] }}</Option>
        </Select>
      </FormItem>
      <FormItem>
        <Input class="code-input" v-model="solution.code" type="textarea" :autosize="{ minRows: 15, maxRows: 20 }"
          :placeholder="t('oj.paste_your_code')" />
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
