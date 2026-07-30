<script setup lang="ts">
import { ProblemJudgeType } from '@putongoj/shared'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import RadioButton from 'primevue/radiobutton'
import Textarea from 'primevue/textarea'
import { useI18n } from 'vue-i18n'
import MarkdownEditor from '@/components/MarkdownEditor.vue'
import ProblemTagSelect from '@/components/ProblemTagSelect.vue'
import { problemJudgeTypeLabels } from '@/utils/constant'

defineProps([ 'problem' ])

const problemJudgeTypeOptions = Object.entries(problemJudgeTypeLabels)
  .map(([ value, label ]) => ({ value, label }))

const { t } = useI18n()
</script>

<template>
  <!-- eslint-disable vue/no-mutating-props -->
  <div v-if="typeof problem.description === 'string'" class="flex flex-col gap-5 problem-edit-wrap">
    <div>
      <InputGroup>
        <InputGroupAddon>{{ t('oj.title') }}</InputGroupAddon>
        <InputText v-model="problem.title" fluid />
      </InputGroup>
    </div>
    <div class="flex gap-6">
      <div class="flex-1">
        <InputGroup>
          <InputGroupAddon>Time</InputGroupAddon>
          <InputNumber v-model="problem.timeLimitMs" fluid :use-grouping="false" />
          <InputGroupAddon>ms</InputGroupAddon>
        </InputGroup>
      </div>
      <div class="flex-1">
        <InputGroup>
          <InputGroupAddon>Memory</InputGroupAddon>
          <InputNumber v-model="problem.memoryLimitKb" fluid :use-grouping="false" />
          <InputGroupAddon>KB</InputGroupAddon>
        </InputGroup>
      </div>
    </div>
    <div>
      <span class="form-label">{{ t('oj.description') }}</span>
      <MarkdownEditor v-model="problem.description" />
    </div>
    <div>
      <span class="form-label">{{ t('oj.input') }}</span>
      <MarkdownEditor v-model="problem.inputFormat" />
    </div>
    <div>
      <span class="form-label">{{ t('oj.output') }}</span>
      <MarkdownEditor v-model="problem.outputFormat" />
    </div>
    <div>
      <span class="form-label">{{ t('oj.sample_input') }}</span>
      <Textarea v-model="problem.sampleInput" class="code-input" fluid rows="8" />
    </div>
    <div>
      <span class="form-label">{{ t('oj.sample_output') }}</span>
      <Textarea v-model="problem.sampleOutput" class="code-input" fluid rows="8" />
    </div>
    <div>
      <span class="form-label">{{ t('oj.hint') }}</span>
      <MarkdownEditor v-model="problem.hint" />
    </div>
    <div>
      <span class="form-label">Tags</span>
      <ProblemTagSelect v-model="problem.tagIds" />
    </div>
    <div>
      <span class="form-label">Problem Type</span>
      <div class="flex flex-wrap gap-4 mt-2">
        <div v-for="item in problemJudgeTypeOptions" :key="item.value" class="flex gap-2 items-center">
          <RadioButton v-model="problem.judgeType" :input-id="`type-${item.value}`" name="problemType" :value="item.value" />
          <label :for="`type-${item.value}`">{{ item.label }}</label>
        </div>
      </div>
    </div>
    <div v-if="problem.judgeType !== ProblemJudgeType.TRADITIONAL">
      <span class="form-label">Judge Code</span>
      <Textarea v-model="problem.judgeCode" class="font-mono" fluid auto-resize rows="15" />
    </div>
  </div>
</template>

<style lang="stylus" scoped>
.problem-edit-wrap
  margin-bottom: 20px
  .form-label
    font-size: 16px
    font-weight: bold
    display: block
    margin-bottom: 6px
</style>
