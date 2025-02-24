<script setup>
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import VditorPreview from 'vditor/dist/method.min'
import 'vditor/dist/index.css'

const { locale } = useI18n()

const props = defineProps(['modelValue'])
const preview = ref(null)
const config = {
  lang: locale.value.replace('-', '_'),
  after() {
    rendering = false
  },
  render: {
    media: {
      enable: false,
    },
  },
}

let rendering = $ref(false)
let renderPromise = $ref(Promise.resolve())
let waiting = $ref(false)

async function render() {
  if (!preview.value || !props.modelValue || waiting) return

  waiting = true
  try {
    await renderPromise
  } catch (e) {
    console.error(e)
  }
  waiting = false
  rendering = true
  renderPromise = VditorPreview.preview(
    preview.value,
    props.modelValue,
    config
  )
}

onMounted(render)
watch(() => props.modelValue, render)
</script>

<template>
  <div>
    <div class="vidtor-uninitialized" v-if="rendering">
      <Icon type="ios-loading" class="card-icon" />
      <span class="card-text">Rendering...</span>
    </div>
    <div ref="preview" v-show="!rendering"></div>
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
</style>
