<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import MarkdownPreview from '@/components/MarkdownPreview.vue'
import { useMessage } from '@/utils/message'

const props = defineProps([ 'modelValue' ])
const { t } = useI18n()
const message = useMessage()
const { copy } = useClipboard()

const problem = computed(() => props.modelValue)

function onCopy (content: string) {
  copy(content)
  message.success('Copied!')
}
</script>

<template>
  <div class="proinfo-wrap">
    <h1 class="font-bold text-4xl">
      <slot name="title">
        {{ problem.pid }}: {{ problem.title }}
      </slot>
    </h1>
    <h5 class="flex flex-wrap gap-4 justify-center">
      <span>Time Limit: {{ problem.time }}ms</span>
      <span>Memory Limit: {{ problem.memory }}KB</span>
    </h5>
    <h2 class="font-semibold">
      {{ t('oj.description') }}
    </h2>
    <MarkdownPreview v-model="problem.description" class="cont" />
    <template v-if="problem.input?.trim()">
      <h2 class="font-semibold">
        {{ t('oj.input') }}
      </h2>
      <MarkdownPreview v-model="problem.input" class="cont" />
    </template>
    <template v-if="problem.output?.trim()">
      <h2 class="font-semibold">
        {{ t('oj.output') }}
      </h2>
      <MarkdownPreview v-model="problem.output" class="cont" />
    </template>
    <template v-if="problem.in?.trim()">
      <h2 class="font-semibold">
        {{ t('oj.sample_input') }}
        <i v-tooltip.top="t('oj.click_to_copy_code')" class="pi pi-file" style="cursor: pointer" @click="onCopy(problem.in)" />
      </h2>
      <pre class="problem-sample-block"><code>{{ problem.in }}</code></pre>
    </template>
    <template v-if="problem.out?.trim()">
      <h2 class="font-semibold">
        {{ t('oj.sample_output') }}
        <i v-tooltip.top="t('oj.click_to_copy_code')" class="pi pi-file" style="cursor: pointer" @click="onCopy(problem.out)" />
      </h2>
      <pre class="problem-sample-block"><code>{{ problem.out }}</code></pre>
    </template>
    <template v-if="problem.hint?.trim()">
      <h2 class="font-semibold">
        {{ t('oj.hint') }}
      </h2>
      <MarkdownPreview v-model="problem.hint" class="cont" />
    </template>
  </div>
</template>

<style lang="stylus" scoped>
h1
  margin-top: 10px
  margin-bottom: 8px
  text-align: center
h5
  margin-bottom: 10px
  text-align:center
h2
  border-bottom: 1px solid #e8e8e8
  padding: 10px 0
.cont
  margin-top: 10px
  margin-bottom: 20px
.problem-sample-block
  padding: 10px
  border-radius: 5px
  background-color: #ECEFF1
  overflow-x: auto

.ptoj-dark .problem-sample-block
  color: var(--p-text-color)
  background-color: var(--p-content-hover-background)
  border: 1px solid var(--p-surface-border)
</style>
