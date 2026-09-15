<script setup lang="ts">
import { storeToRefs } from 'pinia'
import VditorMethod from 'vditor/dist/method'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRootStore } from '@/store'
import { useThemeStore } from '@/store/theme'
import 'vditor/dist/index.css'
import '@/styles/vditor.styl'

const props = defineProps<{
  modelValue: string
}>()

const { locale } = useI18n()
const rootStore = useRootStore()
const themeStore = useThemeStore()
const { effectiveTheme } = storeToRefs(themeStore)
const { vditorCDN } = storeToRefs(rootStore)
const preview = ref<HTMLDivElement | null>(null)
const renderPromise = ref(Promise.resolve())
const rendering = ref(false)
const waiting = ref(false)

const i18nLang = computed(() => {
  return locale.value === 'zh-CN' ? 'zh_CN' : 'en_US'
})

async function render () {
  if (!preview.value || waiting.value || props.modelValue === undefined) {
    return
  }

  waiting.value = true
  try {
    await renderPromise.value
  } catch (e) {
    console.error(e)
  }
  waiting.value = false

  rendering.value = true
  renderPromise.value = VditorMethod.preview(
    preview.value,
    props.modelValue,
    {
      cdn: vditorCDN.value,
      hljs: {
        style: effectiveTheme.value === 'dark' ? 'github-dark' : 'github',
      },
      lang: i18nLang.value,
      mode: effectiveTheme.value,
      render: {
        media: {
          enable: false,
        },
      },
      theme: {
        current: effectiveTheme.value,
      },
      after () {
        rendering.value = false
      },
    },
  )
}

onMounted(() => nextTick(render))
watch(() => props.modelValue, render)
watch(effectiveTheme, render)
</script>

<template>
  <div>
    <div v-if="rendering" class="vidtor-uninitialized">
      <i class="card-icon pi pi-spin pi-spinner" />
      <span class="card-text">Rendering...</span>
    </div>
    <div v-show="!rendering" ref="preview" class="text-color vditor-initialized" />
  </div>
</template>

<style lang="stylus" scoped>
.vidtor-uninitialized
  margin-bottom 20px
  padding 32px
  border-radius 4px
  display flex
  align-items center
  justify-content center
  .card-icon
    font-size 32px
  .card-text
    margin-left 32px

.vditor-initialized
  overflow visible
</style>
