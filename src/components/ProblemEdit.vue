<script setup>
import { useI18n } from 'vue-i18n'
import MarkdownEditor from '@/components/MarkdownEditor'

defineProps(['problem'])
const { t } = useI18n()
</script>

<template>
  <div class="proadd-wrap" v-if="typeof problem.description === 'string'">
    <Row>
      <Col :span="23">
      <!-- eslint-disable-next-line vue/no-mutating-props -->
      <Input v-model="problem.title">
      <template #prepend>
        {{ t('oj.title') }}
      </template>
      </Input>
      </Col>
    </Row>
    <Row>
      <Col :span="11">
      <!-- eslint-disable-next-line vue/no-mutating-props -->
      <Input v-model="problem.time">
      <template #prepend>
        Time
      </template>
      <template #append>
        MS
      </template>
      </Input>
      </Col>
      <Col :offset="1" :span="11">
      <!-- eslint-disable-next-line vue/no-mutating-props -->
      <Input v-model="problem.memory">
      <template #prepend>
        Memory
      </template>
      <template #append>
        KB
      </template>
      </Input>
      </Col>
    </Row>
    <div class="label">
      {{ t('oj.description') }}
    </div>
    <Row>
      <Col :span="23">
      <!-- eslint-disable-next-line vue/no-mutating-props -->
      <MarkdownEditor v-model="problem.description" />
      </Col>
    </Row>
    <div class="label">
      {{ t('oj.input') }}
    </div>
    <Row>
      <Col :span="23">
      <!-- eslint-disable-next-line vue/no-mutating-props -->
      <MarkdownEditor v-model="problem.input" />
      </Col>
    </Row>
    <div class="label">
      {{ t('oj.output') }}
    </div>
    <Row>
      <Col :span="23">
      <!-- eslint-disable-next-line vue/no-mutating-props -->
      <MarkdownEditor v-model="problem.output" />
      </Col>
    </Row>
    <div class="label">
      {{ t('oj.sample_input') }}
    </div>
    <Row>
      <Col :span="23">
      <!-- eslint-disable-next-line vue/no-mutating-props -->
      <Input v-model="problem.in" type="textarea" :rows="8" />
      </Col>
    </Row>
    <div class="label">
      {{ t('oj.sample_output') }}
    </div>
    <Row>
      <Col :span="23">
      <!-- eslint-disable-next-line vue/no-mutating-props -->
      <Input v-model="problem.out" type="textarea" :rows="8" />
      </Col>
    </Row>
    <div class="label">
      {{ t('oj.hint') }}
    </div>
    <Row>
      <Col :span="23">
      <!-- eslint-disable-next-line vue/no-mutating-props -->
      <MarkdownEditor v-model="problem.hint" />
      </Col>
    </Row>
    <div class="label">
      {{ t('oj.spj') }} <i-switch v-model="problem.spj" />
    </div>
    <Row>
      <Col :span="23">
      <!-- eslint-disable-next-line vue/no-mutating-props -->
      <Input v-model="problem.spjcode" type="textarea" :rows="8" :placeholder="t('oj.spj_code')" />
      </Col>
    </Row>
  </div>
</template>

<style lang="stylus">
.proadd-wrap
  margin-bottom: 20px
  .ivu-input-wrapper
    margin-bottom: 14px
  .label
    text-align:left
    margin-bottom: 10px
  .ql-container
    // text-align: left
    height: 220px
    margin-bottom: 2em
  .el-textarea
    margin-bottom: 20px
</style>
