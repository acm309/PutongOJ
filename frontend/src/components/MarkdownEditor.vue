<script setup>
import { storeToRefs } from 'pinia'
import Vditor from 'vditor'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRootStore } from '@/store'
import 'vditor/dist/index.css'

const props = defineProps({
  modelValue: String,
  height: {
    type: Number,
    default: 512,
  },
})
const emit = defineEmits([ 'update:modelValue' ])
const { locale } = useI18n()
const rootStore = useRootStore()
const { vditorCDN } = $(storeToRefs(rootStore))

let editor = null

const lang = $computed(() => locale.value.replace('-', '_'))
const vditor = ref(null)
const config = $computed(() => ({
  cache: {
    enable: false,
  },
  cdn: vditorCDN,
  fullscreen: {
    index: 110,
  },
  height: props.height,
  input: (value) => {
    emit('update:modelValue', value)
  },
  lang,
  minHeight: 256,
  mode: 'wysiwyg',
  placeholder: 'Type something...',
  preview: {
    render: {
      media: {
        enable: false,
      },
    },
  },
  resize: {
    enable: true,
    position: 'bottom',
  },
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
  after: () => {
    editor.setValue(props.modelValue || '')
  },
}))

function init () {
  if (editor) editor.destroy()
  editor = new Vditor(vditor.value, config)
}

onMounted(init)

onBeforeUnmount(() => {
  editor.destroy()
  editor = null
})

watch(() => props.modelValue, (value) => {
  if (!editor) return
  if (value === editor.getValue()) return
  nextTick(() => {
    editor.setValue(value)
  })
})

watch(() => props.height, init)
watch(() => locale.value, () => nextTick(init))
</script>

<template>
  <div ref="vditor">
    <div class="vidtor-uninitialized">
      <Icon type="ios-loading" class="card-icon" />
      <span class="card-text">Initializing...</span>
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
