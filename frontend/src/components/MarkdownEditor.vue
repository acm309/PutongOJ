<script setup lang="ts">
import { storeToRefs } from 'pinia'
import Vditor from 'vditor'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRootStore } from '@/store'
import 'vditor/dist/index.css'
import '@/styles/vditor.styl'

const props = withDefaults(defineProps<{
  modelValue: string
  height?: number
}>(), {
  height: 512,
})
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const { t, locale } = useI18n()
const rootStore = useRootStore()
const { vditorCDN, colorScheme } = storeToRefs(rootStore)

const editor = ref<Vditor | null>(null)
const vditor = ref<HTMLElement | null>(null)

const i18nLang = computed(() => {
  return locale.value === 'zh-CN' ? 'zh_CN' : 'en_US'
})

function init () {
  if (!vditor.value) {
    return
  }
  if (editor.value) {
    editor.value.destroy()
  }
  editor.value = new Vditor(vditor.value, {
    cache: {
      enable: false,
    },
    cdn: vditorCDN.value,
    fullscreen: {
      index: 110,
    },
    height: props.height,
    input: (value: string) => {
      emit('update:modelValue', value)
    },
    lang: i18nLang.value,
    minHeight: 256,
    mode: 'wysiwyg',
    placeholder: t('oj.type_something'),
    preview: {
      hljs: {
        style: colorScheme.value === 'dark' ? 'github-dark' : 'github',
      },
      render: {
        media: {
          enable: false,
        },
      },
      theme: {
        current: colorScheme.value,
      },
    },
    resize: {
      enable: true,
      position: 'bottom',
    },
    theme: colorScheme.value === 'dark' ? 'dark' : 'classic',
    toolbar: [
      'headings',
      'bold',
      'italic',
      'strike',
      'link',
      '|',
      'list',
      'ordered-list',
      'check',
      'outdent',
      'indent',
      '|',
      'quote',
      'line',
      'code',
      'inline-code',
      'insert-before',
      'insert-after',
      '|',
      'upload',
      'table',
      '|',
      'undo',
      'redo',
      '|',
      'fullscreen',
      'edit-mode',
      'preview',
      {
        name: 'more',
        toolbar: [
          'both',
          'export',
          'outline',
        ],
      },
    ],
    upload: {
      url: '/api/upload',
      accept: 'image/*',
      max: 5 * 1024 * 1024,
      multiple: false,
      fieldName: 'image',
      format: (files, responseText) => {
        const filename = files[0].name
        const url = JSON.parse(responseText).url
        return JSON.stringify({ data: { succMap: { [filename]: url } } })
      },
    },
    customWysiwygToolbar: () => {},
    after: () => {
      editor.value!.setValue(props.modelValue || '')
    },
  })
}

onMounted(init)

onBeforeUnmount(() => {
  editor.value?.destroy()
  editor.value = null
})

watch(() => props.modelValue, (value) => {
  if (!editor.value) {
    return
  }
  if (value === editor.value.getValue()) {
    return
  }
  nextTick(() => {
    editor.value!.setValue(value)
  })
})

watch(() => props.height, init)
watch(locale, () => nextTick(init))
watch(colorScheme, () => nextTick(init))
</script>

<template>
  <div ref="vditor">
    <div class="vidtor-uninitialized">
      <Icon type="ios-loading" class="card-icon" />
      <span class="card-text">{{ t('oj.initializing') }}</span>
    </div>
  </div>
</template>

<style lang="stylus">
.vditor-preview__action
  display none
</style>

<style lang="stylus" scoped>
.vidtor-uninitialized
  margin-bottom 20px
  padding 32px
  border 1px solid #dcdee2
  border-radius 4px
  display flex
  align-items center
  justify-content center
  .card-icon
    font-size 32px
  .card-text
    margin-left 32px
</style>
