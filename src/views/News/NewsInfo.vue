<template>
  <div class="news">
    <h1>{{ news.title }}</h1>
    <h4>{{ timePretty(news.create) }}</h4>
    <div class="news-cont" v-html="news.content"></div>
  </div>
</template>
<script>
import { mapState, mapActions } from 'pinia'
import { useNewsStore } from '@/store/modules/news'
import { useRootStore } from '@/store'
import { timePretty } from '@/util/formate'

export default {
  computed: {
    ...mapState(useNewsStore, ['news'])
  },
  created () {
    this.findOne(this.$route.params).then(() => {
      this.changeDomTitle({ title: `News -- ${this.news.title}` })
    })
  },
  methods: {
    ...mapActions(useRootStore, ['changeDomTitle']),
    ...mapActions(useNewsStore, ['findOne']),
    timePretty
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
