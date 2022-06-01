<script>
import { mapState } from 'pinia'
import { useNewsStore } from '@/store/modules/news'
import { timePretty } from '@/util/formate'

export default {
  computed: {
    ...mapState(useNewsStore, [ 'news' ]),
  },
  methods: {
    timePretty,
  },
}
</script>

<template>
  <div class="news">
    <h1>{{ news.title }}</h1>
    <h4>{{ timePretty(news.create) }}</h4>
    <div class="news-cont" v-html="news.content" />
  </div>
</template>

<style lang="stylus" scoped>
h1, h4
  margin-bottom: 10px
.news-cont
  padding-top: 10px
  text-align: left
  border-top: 1px solid #dfd8d8
</style>
