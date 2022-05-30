<template>
  <div id="app">
    <oj-layout></oj-layout>
  </div>
</template>

<script>
import Layout from '@/components/Layout'
import { mapActions } from 'pinia'
import { useRootStore } from '@/store'

export default {
  name: 'app',
  components: {
    'oj-layout': Layout
  },
  methods: {
    ...mapActions(useRootStore, ['changeDomTitle', 'fetchTime', 'updateTime'])
  },
  created () {
    this.$Message.config({
      duration: 3.5 // 默认的 1.5s 也太短了
    })
    this.fetchTime().then(() => {
      this.updateTime()
    })
  },
  watch: {
    '$route' () {
      this.changeDomTitle(this.$route.meta)
    }
  }
}
</script>

<style lang="stylus">
a
  text-decoration: none
ul, li
  list-style-type: none
.ac
  color: red
.wa, .re, .tle, .mle, .ole, .se, .rp
  color: #11b811
.ce
  color: #6633FF
.pe
  color: orange
.pd, .rj
  color: black
</style>
