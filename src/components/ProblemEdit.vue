<script setup>
import ContentEditor from '@/components/ContentEditor'

defineProps([ 'problem' ])
</script>

<template>
  <div class="proadd-wrap">
    <Row>
      <Col :span="23">
        <!-- eslint-disable-next-line vue/no-mutating-props -->
        <Input v-model="problem.title">
          <template #prepend>
            Title
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
      Description
    </div>
    <Row>
      <Col :span="23">
        <!-- eslint-disable-next-line vue/no-mutating-props -->
        <ContentEditor v-model="problem.description" />
      </Col>
    </Row>
    <div class="label">
      Input
    </div>
    <Row>
      <Col :span="23">
        <!-- eslint-disable-next-line vue/no-mutating-props -->
        <ContentEditor v-model="problem.input" />
      </Col>
    </Row>
    <div class="label">
      Output
    </div>
    <Row>
      <Col :span="23">
        <!-- eslint-disable-next-line vue/no-mutating-props -->
        <ContentEditor v-model="problem.output" />
      </Col>
    </Row>
    <div class="label">
      Hint
    </div>
    <Row>
      <Col :span="23">
        <!-- eslint-disable-next-line vue/no-mutating-props -->
        <ContentEditor v-model="problem.hint" />
      </Col>
    </Row>
    <div class="label">
      Sample Input
    </div>
    <Row>
      <Col :span="23">
        <!-- eslint-disable-next-line vue/no-mutating-props -->
        <Input v-model="problem.in" type="textarea" :rows="8" />
      </Col>
    </Row>
    <div class="label">
      Sample Output
    </div>
    <Row>
      <Col :span="23">
        <!-- eslint-disable-next-line vue/no-mutating-props -->
        <Input v-model="problem.out" type="textarea" :rows="8" />
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
