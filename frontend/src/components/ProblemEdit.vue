<script setup>
import { Col, Form, FormItem, Input, Radio, RadioGroup, Row } from 'view-ui-plus'
import { useI18n } from 'vue-i18n'
import MarkdownEditor from '@/components/MarkdownEditor'
import ProblemTagSelect from '@/components/ProblemTagSelect.vue'
import { problemType } from '@/utils/constant'

defineProps([ 'problem' ])

const problemTypeOptions = Object.entries(problemType)
  .map(([ value, label ]) => ({
    value: Number(value),
    label,
  }))

const { t } = useI18n()
</script>

<template>
  <!-- eslint-disable vue/no-mutating-props -->
  <Form v-if="typeof problem.description === 'string'" class="problem-edit-wrap" label-position="top">
    <FormItem>
      <Input v-model="problem.title">
        <template #prepend>
          {{ t('oj.title') }}
        </template>
      </Input>
    </FormItem>
    <FormItem>
      <Row :gutter="24">
        <Col :span="12">
          <Input v-model="problem.time" class="form-item" type="number">
            <template #prepend>
              Time
            </template>
            <template #append>
              ms
            </template>
          </Input>
        </Col>
        <Col :span="12">
          <Input v-model="problem.memory" class="form-item" type="number">
            <template #prepend>
              Memory
            </template>
            <template #append>
              KB
            </template>
          </Input>
        </Col>
      </Row>
    </FormItem>
    <FormItem>
      <template #label>
        <span class="form-label">{{ t('oj.description') }}</span>
      </template>
      <MarkdownEditor v-model="problem.description" />
    </FormItem>
    <FormItem>
      <template #label>
        <span class="form-label">{{ t('oj.input') }}</span>
      </template>
      <MarkdownEditor v-model="problem.input" />
    </FormItem>
    <FormItem>
      <template #label>
        <span class="form-label">{{ t('oj.output') }}</span>
      </template>
      <MarkdownEditor v-model="problem.output" />
    </FormItem>
    <FormItem>
      <template #label>
        <span class="form-label">{{ t('oj.sample_input') }}</span>
      </template>
      <Input v-model="problem.in" class="code-input" type="textarea" :rows="8" />
    </FormItem>
    <FormItem>
      <template #label>
        <span class="form-label">{{ t('oj.sample_output') }}</span>
      </template>
      <Input v-model="problem.out" class="code-input" type="textarea" :rows="8" />
    </FormItem>
    <FormItem>
      <template #label>
        <span class="form-label">{{ t('oj.hint') }}</span>
      </template>
      <MarkdownEditor v-model="problem.hint" />
    </FormItem>
    <FormItem>
      <template #label>
        <span class="form-label">Tags</span>
      </template>
      <ProblemTagSelect v-model="problem.tags" />
    </FormItem>
    <FormItem>
      <template #label>
        <span class="form-label">Problem Type</span>
      </template>
      <RadioGroup v-model="problem.type">
        <Radio v-for="item in problemTypeOptions" :key="item.value" :label="item.value" border>
          {{ item.label }}
        </Radio>
      </RadioGroup>
    </FormItem>
    <FormItem v-if="[2, 3].includes(problem.type)">
      <template #label>
        <span class="form-label">Code of {{ problemType[problem.type] }}</span>
      </template>
      <Input v-model="problem.code" class="code-input" type="textarea" :autosize="{ minRows: 15, maxRows: 20 }" />
    </FormItem>
  </Form>
</template>

<style lang="stylus" scoped>
.problem-edit-wrap
  margin-bottom: 20px
  .form-label
    font-size: 16px
    font-weight: bold
  .code-input
    font-family var(--font-code)
</style>
