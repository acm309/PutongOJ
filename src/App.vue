<template>
  <div id="app">
    <oj-layout></oj-layout>
  </div>
</template>

<script>
import Layout from '@/components/Layout'
import { mapActions } from 'pinia'
import { useRootStore } from '@/store'
import { setErrorHandler } from './api'

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
    setErrorHandler((err) => {
      if (err.response && err.response.status >= 500) {
        this.$Message.error({
          content: `Σ(;ﾟдﾟ)  服务器崩坏，需要联系管理员维修`,
          duration: 6.5
        })
      } else if (err.response && err.response.status === 403) {
        this.$Message.error({
          content: `╮(╯_╰)╭ 你没有相关权限进行此操作`,
          duration: 6.5
        })
      } else if (err.response && err.response.status === 401) {
        this.$Message.error({
          content: `(〃∀〃) 请先登录`,
          duration: 6.5
        })
      } else if (err.response && err.response.status >= 400 && err.response.status < 500) {
        this.$Message.error({
          content: `${err.response.data.error}`,
          duration: 6.5
        })
      } else if (!err.response) {
        this.$Message.error({
          content: `_(:з」∠)_  网络异常，检查你的网线`,
          duration: 6.5
        })
      } else {
        this.$Message.error({
          content: err.message,
          duration: 6.5
        })
      }
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
