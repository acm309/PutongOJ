<script setup>
import { storeToRefs } from 'pinia'
import MarkdownPreview from '@/components/MarkdownPreview'

import { useNewsStore } from '@/store/modules/news'
import { timePretty } from '@/utils/formate'

const { news } = $(storeToRefs(useNewsStore()))
</script>

<template>
  <div class="news-info">
    <div class="news-header-container">
      <div class="news-header">
        <h1 class="font-bold">
          {{ news.title || '' }}
        </h1>
        <h4>{{ timePretty(news.create, 'yyyy-MM-dd HH:mm') }}</h4>
      </div>
    </div>
    <MarkdownPreview v-model="news.content" class="news-content" />
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
