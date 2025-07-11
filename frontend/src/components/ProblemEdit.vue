<script setup>
import { Input, Radio, RadioGroup } from 'view-ui-plus'
import { useI18n } from 'vue-i18n'
import MarkdownEditor from '@/components/MarkdownEditor'
import { problemType } from '@/util/constant'

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
  <div v-if="typeof problem.description === 'string'" class="proadd-wrap">
    <div class="form-item">
      <Input v-model="problem.title">
        <template #prepend>
          {{ t('oj.title') }}
        </template>
      </Input>
    </div>
    <div class="form-row">
      <Input v-model="problem.time" class="form-item" type="number">
        <template #prepend>
          Time
        </template>
        <template #append>
          ms
        </template>
      </Input>
      <Input v-model="problem.memory" class="form-item" type="number">
        <template #prepend>
          Memory
        </template>
        <template #append>
          KB
        </template>
      </Input>
    </div>
    <div class="form-item">
      <div class="label">
        {{ t('oj.description') }}
      </div>
      <MarkdownEditor v-model="problem.description" />
    </div>
    <div class="form-item">
      <div class="label">
        {{ t('oj.input') }}
      </div>
      <MarkdownEditor v-model="problem.input" />
    </div>
    <div class="form-item">
      <div class="label">
        {{ t('oj.output') }}
      </div>
      <MarkdownEditor v-model="problem.output" />
    </div>
    <div class="form-item">
      <div class="label">
        {{ t('oj.sample_input') }}
      </div>
      <Input v-model="problem.in" type="textarea" :rows="8" />
    </div>
    <div class="form-item">
      <div class="label">
        {{ t('oj.sample_output') }}
      </div>
      <Input v-model="problem.out" type="textarea" :rows="8" />
    </div>
    <div class="form-item">
      <div class="label">
        {{ t('oj.hint') }}
      </div>
      <MarkdownEditor v-model="problem.hint" />
    </div>
    <div class="form-item">
      <div class="label">
        Problem Type
      </div>
      <RadioGroup v-model="problem.type">
        <Radio v-for="item in problemTypeOptions" :key="item.value" :label="item.value" border>
          {{ item.label }}
        </Radio>
      </RadioGroup>
    </div>
    <div v-if="[2, 3].includes(problem.type)" class="form-item">
      <div class="label">
        Code of {{ { 2: "Interactor", 3: "Checker" }[problem.type] }}
      </div>
      <Input v-model="problem.code" class="code-input" type="textarea" :autosize="{ minRows: 15, maxRows: 20 }" />
    </div>
  </div>
</template>

<style lang="stylus" scoped>
.proadd-wrap
  margin-bottom: 20px

  .form-item
    margin-bottom: 20px

    .label
      text-align: left
      margin-bottom: 10px
      font-size: 16px
      font-weight: bold

  .form-row
    display: flex
    gap: 20px
    margin-bottom: 20px

    .form-item
      flex: 1
      margin: 0

  .code-input
    font-family var(--font-code)
</style>
