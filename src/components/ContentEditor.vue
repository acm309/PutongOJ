<script setup>
import ImageUploader from 'quill-image-uploader'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import api from '@/api'

const props = defineProps([ 'modelValue' ])
const emit = defineEmits([ 'update:modelValue' ])

const modules = {
  name: 'imageUploader',
  module: ImageUploader,
  options: {
    async upload (file) {
      const formData = new window.FormData()
      formData.append('image', file)
      const { data } = await api.getImage(formData)
      return data.url
    },
  },
}
</script>

<template>
  <QuillEditor
    :content="props.modelValue"
    theme="snow"
    toolbar="full" content-type="html" :modules="modules" @update:content="(v) => emit('update:modelValue', v)"
  />
</template>

<style lang="stylus">
.ql-container
  height: auto
</style>
