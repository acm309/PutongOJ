<script setup lang="ts">
import { storeToRefs } from 'pinia'
import InputText from 'primevue/inputtext'
import { useI18n } from 'vue-i18n'
import MarkdownEditor from '@/components/MarkdownEditor.vue'
import { useNewsStore } from '@/store/modules/news'

const newsStore = useNewsStore()

const { t } = useI18n()
const { news } = storeToRefs(newsStore)
</script>

<template>
  <div v-if="typeof news.content === 'string'">
    <InputText v-model="news.title" type="text" size="large" fluid class="mb-4" :placeholder="t('oj.title')" />
    <MarkdownEditor v-model="news.content" :height="768" />
  </div>
</template>
