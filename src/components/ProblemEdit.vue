<script setup>
import { useI18n } from 'vue-i18n'
import MarkdownEditor from '@/components/MarkdownEditor'

defineProps(['problem'])
const { t } = useI18n()
</script>

<template>
  <div class="proadd-wrap" v-if="typeof problem.description === 'string'">
    <div class="form-item">
      <Input v-model="problem.title">
        <template #prepend>
          {{ t('oj.title') }}
        </template>
      </Input>
    </div>

    <div class="form-row">
      <Input v-model="problem.time" class="form-item">
        <template #prepend>
          Time
        </template>
        <template #append>
          ms
        </template>
      </Input>
      <Input v-model="problem.memory" class="form-item">
        <template #prepend>
          Memory
        </template>
        <template #append>
          KB
        </template>
      </Input>
    </div>

    <div class="form-item">
      <div class="label">{{ t('oj.description') }}</div>
      <MarkdownEditor v-model="problem.description" />
    </div>

    <div class="form-item">
      <div class="label">{{ t('oj.input') }}</div>
      <MarkdownEditor v-model="problem.input" />
    </div>

    <div class="form-item">
      <div class="label">{{ t('oj.output') }}</div>
      <MarkdownEditor v-model="problem.output" />
    </div>

    <div class="form-item">
      <div class="label">{{ t('oj.sample_input') }}</div>
      <Input v-model="problem.in" type="textarea" :rows="8" />
    </div>

    <div class="form-item">
      <div class="label">{{ t('oj.sample_output') }}</div>
      <Input v-model="problem.out" type="textarea" :rows="8" />
    </div>

    <div class="form-item">
      <div class="label">{{ t('oj.hint') }}</div>
      <MarkdownEditor v-model="problem.hint" />
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
</style>
