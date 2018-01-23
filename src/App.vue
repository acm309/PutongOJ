<template>
  <div id="app">
    <Spin size="large" v-if="loading"></Spin>
    <oj-layout v-else></oj-layout>
  </div>
</template>

<script>
import Layout from '@/components/Layout'

export default {
  name: 'app',
  data: () => ({
    loading: true
  }),
  created () {
    this.$store.dispatch('session/fetch').then(() => {
      this.loading = false
    })
  },
  components: {
    'oj-layout': Layout
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
