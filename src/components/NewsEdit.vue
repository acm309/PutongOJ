<script setup>
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import ContentEditor from '@/components/ContentEditor'
import { useNewsStore } from '@/store/modules/news'

import { Input } from 'view-ui-plus'

const newsStore = useNewsStore()
const { t } = useI18n()

const { news } = storeToRefs(newsStore)
</script>

<template>
  <div>
    <Input class="news-title" size="large" v-model="news.title" :placeholder="t('oj.title')" />
    <ContentEditor v-model="news.content" />
  </div>
</template>

<style lang="stylus" scoped>
.news-title
  margin-bottom 20px
</style>
