<template lang="html">
  <div class="news">
    <h1>{{ news.title }}</h1>
    <h4>{{ news.create | timePretty }}</h4>
    <div class="news-cont" v-html="news.content"></div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
export default {
  computed: {
    ...mapGetters('news', {
      news: 'news'
    })
  },
  created () {
    this.$store.dispatch('news/findOne', this.$route.params)
  }
}
</script>

<style lang="stylus" scoped>
h1, h4
  margin-bottom: 10px
.news-cont
  padding-top: 10px
  text-align: left
  border-top: 1px solid #dfd8d8
</style>
