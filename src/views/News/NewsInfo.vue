<script setup>
import { storeToRefs } from 'pinia'
import { useNewsStore } from '@/store/modules/news'
import { timePretty } from '@/util/formate'

import MarkdownPreview from '@/components/MarkdownPreview'
import pangu from 'pangu'

const { news } = $(storeToRefs(useNewsStore()))
</script>

<template>
  <div class="news-info">
    <div class="news-header-container">
      <div class="news-header">
        <h1>{{ pangu.spacing(news.title || '') }}</h1>
        <h4>{{ timePretty(news.create) }}</h4>
      </div>
    </div>
    <MarkdownPreview class="news-content" v-model="news.content" />
  </div>
</template>

<style lang="stylus" scoped>
.news-header-container
  width 100%
  padding 20px 0 40px
.news-header
  margin 0 auto
  max-width 640px
  text-align center
  h1, h4
    margin-bottom: 10px
    color hsl(0, 0%, 20%)
.news-content
  padding-bottom 20px
</style>
