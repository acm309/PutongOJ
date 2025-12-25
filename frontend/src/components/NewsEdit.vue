<script setup>
import { storeToRefs } from 'pinia'
import { Input } from 'view-ui-plus'
import { useI18n } from 'vue-i18n'
import MarkdownEditor from '@/components/MarkdownEditor'
import { useNewsStore } from '@/store/modules/news'

const newsStore = useNewsStore()

const { t } = useI18n()
const { news } = storeToRefs(newsStore)
</script>

<template>
  <div v-if="typeof news.content === 'string'">
    <Input v-model="news.title" class="news-title" size="large" :placeholder="t('oj.title')" />
    <MarkdownEditor v-model="news.content" :height="768" />
  </div>
</template>

<style lang="stylus" scoped>
.news-title
  margin-bottom 20px
</style>
