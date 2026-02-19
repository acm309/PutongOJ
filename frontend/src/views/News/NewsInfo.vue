<script setup>
import { storeToRefs } from 'pinia'
import MarkdownPreview from '@/components/MarkdownPreview'
import { useNewsStore } from '@/store/modules/news'
import { timePretty } from '@/utils/format'

const { news } = storeToRefs(useNewsStore())
</script>

<template>
  <div>
    <div class="pb-8 pt-4">
      <div class="max-w-xl mx-auto text-center">
        <h1 class="font-bold mb-2 text-4xl/snug text-pretty">
          {{ news.title || '' }}
        </h1>
        <span class="text-muted-color">
          {{ timePretty(news.create, 'yyyy-MM-dd HH:mm') }}
        </span>
      </div>
    </div>
    <MarkdownPreview v-model="news.content" class="pb-4" />
  </div>
</template>
