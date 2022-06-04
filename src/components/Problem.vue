<script setup>
import { inject } from 'vue'
import { useClipboard } from '@vueuse/core'

defineProps([ 'problem' ])
const $Message = inject('$Message')
const { copy } = useClipboard()
const onCopy = (content) => {
  copy(content)
  $Message.success('Copied!')
}
</script>

<template>
  <div class="proinfo-wrap">
    <h1>
      <slot name="title">
        {{ problem.pid }}:  {{ problem.title }}
      </slot>
    </h1>
    <h5>Time Limit: {{ problem.time }}MS&nbsp;&nbsp;&nbsp;Memory Limit: {{ problem.memory }}KB</h5>
    <h2 class="text-primary">
      Description
    </h2>
    <div class="cont" v-html="problem.description" />
    <h2>Input</h2>
    <div class="cont" v-html="problem.input" />
    <h2>Output</h2>
    <div class="cont" v-html="problem.output" />
    <h2>
      Sample Input
      <Tooltip content="Click to copy" placement="top">
        <Icon type="ios-document-outline" style="cursor: pointer" @click="onCopy(problem.in)" />
      </Tooltip>
    </h2>
    <pre><code>{{ problem.in }}</code></pre>
    <h2>
      Sample Output
      <Tooltip content="Click to copy" placement="top">
        <Icon type="ios-document-outline" style="cursor: pointer" @click="onCopy(problem.out)" />
      </Tooltip>
    </h2>
    <pre><code>{{ problem.out }}</code></pre>
    <div v-if="problem.hint">
      <h2>Hint</h2>
      <div class="cont" v-html="problem.hint" />
    </div>
  </div>
</template>

<style lang="stylus" scoped>
h1
  color: #757575
  margin-top: 10px
  margin-bottom: 8px
  text-align: center
h5
  margin-bottom: 10px
  text-align:center
h2
  border-bottom: 1px solid #e8e8e8
  padding: 10px 0
  color: #757575
.cont
  margin-top: 10px
  margin-bottom: 20px
pre
  padding: 10px
  border-radius: 5px
  background-color: #ECEFF1
</style>
