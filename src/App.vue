<script>
import { useRoute } from 'vue-router'
import { inject, watch } from 'vue'
import { setErrorHandler } from './api'
import OjLayout from '@/components/Layout'
import { useRootStore } from '@/store'

// https://github.com/vuejs/rfcs/blob/master/active-rfcs/0040-script-setup.md#declaring-additional-options
export default {
  name: 'App',
}
</script>

<script setup>
const route = useRoute()
const $Message = inject('$Message')

$Message.config({ duration: 3.5 }) // default: 1.5s
setErrorHandler((err) => {
  if (err.response && err.response.status >= 500) {
    $Message.error({
      content: 'Σ(;ﾟдﾟ)  服务器崩坏，需要联系管理员维修',
      duration: 6.5,
    })
  } else if (err.response && err.response.status === 403) {
    $Message.error({
      content: '╮(╯_╰)╭ 你没有相关权限进行此操作',
      duration: 6.5,
    })
  } else if (err.response && err.response.status === 401) {
    $Message.error({
      content: '(〃∀〃) 请先登录',
      duration: 6.5,
    })
  } else if (err.response && err.response.status >= 400 && err.response.status < 500) {
    $Message.error({
      content: `${err.response.data.error}`,
      duration: 6.5,
    })
  } else if (!err.response) {
    $Message.error({
      content: '_(:з」∠)_  网络异常，检查你的网线',
      duration: 6.5,
    })
  } else {
    $Message.error({
      content: err.message,
      duration: 6.5,
    })
  }
})

const { changeDomTitle, fetchTime, updateTime } = useRootStore()

fetchTime().then(updateTime)
watch(() => route.meta, () => changeDomTitle(route.meta))
</script>

<template>
  <div id="app">
    <OjLayout />
  </div>
</template>
