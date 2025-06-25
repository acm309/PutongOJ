<script setup lang="ts">
import type { Message } from 'view-ui-plus'
import MarkdownPreview from '@/components/MarkdownPreview.vue'
import { useClipboard } from '@vueuse/core'
import { Space } from 'view-ui-plus'
import { inject } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps([ 'modelValue' ])
const { t } = useI18n()
const message = inject('$Message') as typeof Message
const { copy } = useClipboard()

const problem = $computed(() => props.modelValue)

function onCopy (content: string) {
  copy(content)
  message.success('Copied!')
}
</script>

<template>
  <div class="proinfo-wrap">
    <h1>
      <slot name="title">
        {{ problem.pid }}: {{ problem.title }}
      </slot>
    </h1>
    <h5>
      <Space split>
        <span>Time Limit: {{ problem.time }}ms</span>
        <span>Memory Limit: {{ problem.memory }}KB</span>
      </Space>
    </h5>
    <h2 class="text-primary">
      {{ t('oj.description') }}
    </h2>
    <MarkdownPreview v-model="problem.description" class="cont" />
    <template v-if="problem.input?.trim()">
      <h2>{{ t('oj.input') }}</h2>
      <MarkdownPreview v-model="problem.input" class="cont" />
    </template>
    <template v-if="problem.output?.trim()">
      <h2>{{ t('oj.output') }}</h2>
      <MarkdownPreview v-model="problem.output" class="cont" />
    </template>
    <template v-if="problem.in?.trim()">
      <h2>
        {{ t('oj.sample_input') }}
        <Tooltip content="Click to copy" placement="top">
          <Icon type="ios-document-outline" style="cursor: pointer" @click="onCopy(problem.in)" />
        </Tooltip>
      </h2>
      <pre><code>{{ problem.in }}</code></pre>
    </template>
    <template v-if="problem.out?.trim()">
      <h2>
        {{ t('oj.sample_output') }}
        <Tooltip :content="t('oj.click_to_copy_code')" placement="top">
          <Icon type="ios-document-outline" style="cursor: pointer" @click="onCopy(problem.out)" />
        </Tooltip>
      </h2>
      <pre><code>{{ problem.out }}</code></pre>
    </template>
    <template v-if="problem.hint?.trim()">
      <h2>
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
pre
  padding: 10px
  border-radius: 5px
  background-color: #ECEFF1
</style>
