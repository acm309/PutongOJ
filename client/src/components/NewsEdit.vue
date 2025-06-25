<script setup>
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useNewsStore } from '@/store/modules/news'
import { Input } from 'view-ui-plus'

import MarkdownEditor from '@/components/MarkdownEditor'

const newsStore = useNewsStore()

const { t } = useI18n()
const { news } = storeToRefs(newsStore)
</script>

<template>
  <div v-if="typeof news.content === 'string'">
    <Input class="news-title" size="large" v-model="news.title" :placeholder="t('oj.title')" />
    <MarkdownEditor v-model="news.content" :height="768" />
  </div>
</template>

<style lang="stylus" scoped>
.news-title
  margin-bottom 20px
</style>
