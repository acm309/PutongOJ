<script>
import { storeToRefs } from 'pinia'
import ConfirmPopup from 'primevue/confirmpopup'
import Toast from 'primevue/toast'
import { inject, nextTick, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import OjLayout from '@/components/Layout'
import { useRootStore } from '@/store'
import { setErrorHandler } from './api'
import { useSessionStore } from './store/modules/session'
import { onProfileUpdate } from './utils/helper'
import { useWebSocket } from './utils/websocket'

// https://github.com/vuejs/rfcs/blob/master/active-rfcs/0040-script-setup.md#declaring-additional-options
export default {
  name: 'App',
}
</script>

<script setup>
const route = useRoute()
const $Message = inject('$Message')
const { t } = useI18n()

$Message.config({ duration: 3.5 }) // default: 1.5s
setErrorHandler((err) => {
  if (err.response && err.response.status >= 500) {
    $Message.error({
      content: t('oj.error_500'),
      duration: 6.5,
    })
  } else if (err.response && err.response.status === 404) {
    $Message.error({
      content: t('oj.error_404'),
      duration: 6.5,
    })
  } else if (err.response && err.response.status === 403) {
    $Message.error({
      content: t('oj.error_403'),
      duration: 6.5,
    })
  } else if (err.response && err.response.status === 401) {
    $Message.error({
      content: t('oj.error_401'),
      duration: 6.5,
    })
  } else if (err.response && err.response.status === 429) {
    $Message.error({
      content: t('oj.error_429'),
      duration: 6.5,
    })
  } else if (err.response && err.response.status >= 400 && err.response.status < 500) {
    $Message.error({
      content: err.response.data.error || 'Bad Request',
      duration: 6.5,
    })
  } else if (!err.response) {
    $Message.error({
      content: t('oj.lose_connection'),
      duration: 6.5,
    })
  } else {
    $Message.error({
      content: err.message,
      duration: 6.5,
    })
  }
  return Promise.reject(err)
})

const { changeDomTitle, fetchTime, updateTime } = useRootStore()

setTimeout(() => fetchTime().then(updateTime), 1000)
watch(() => route.meta, () => changeDomTitle(route.meta))

const { isLogined } = storeToRefs(useSessionStore())
const websocket = useWebSocket()

async function initWebSocket () {
  if (isLogined.value) {
    await websocket.connect()
  } else {
    websocket.disconnect()
  }
}

setTimeout(async () => {
  await initWebSocket()
  onProfileUpdate(() => nextTick(initWebSocket))
}, 1000)
</script>

<template>
  <div id="app">
    <OjLayout />
    <Toast group="global" style="top: 82px" />
    <ConfirmPopup />
  </div>
</template>

<style src="./styles/tailwind.css" />

<style lang="stylus">
html
  font-size: 14px !important
#app
  [class^="p-"], [class*=" p-"]
    line-height: normal !important
</style>
