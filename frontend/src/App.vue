<script lang="ts">
import { storeToRefs } from 'pinia'
import ConfirmPopup from 'primevue/confirmpopup'
import Toast from 'primevue/toast'
import { nextTick, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import OjLayout from '@/components/Layout.vue'
import { useRootStore } from '@/store'
import { setErrorHandler } from './api'
import { useSessionStore } from './store/modules/session'
import { onProfileUpdate } from './utils/helper'
import { useMessage } from './utils/message'
import { useWebSocket } from './utils/websocket'

// https://github.com/vuejs/rfcs/blob/master/active-rfcs/0040-script-setup.md#declaring-additional-options
export default {
  name: 'App',
}
</script>

<script setup lang="ts">
const route = useRoute()
const message = useMessage()
const { t } = useI18n()

setErrorHandler((err) => {
  let detail: string = err.message || t('ptoj.unknown_error_occurred')
  if (err.response?.status) {
    const status = err.response.status
    if (status === 401) {
      detail = t('ptoj.request_error_401')
    } else if (status === 403) {
      detail = t('ptoj.request_error_403')
    } else if (status === 404) {
      detail = t('ptoj.request_error_404')
    } else if (status === 429) {
      detail = t('ptoj.request_error_429')
    } else if (status >= 500) {
      detail = t('ptoj.request_error_500')
    } else {
      detail = `${status} ${err.response.statusText}`
    }
  } else if (!err.response) {
    detail = t('ptoj.request_connection_lost')
  }
  message.error(t('ptoj.request_error_occurred'), detail)
})

const rootStore = useRootStore()
const { changeDomTitle, fetchTime, updateTime } = rootStore
const { colorScheme } = storeToRefs(rootStore)

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

watch(colorScheme, (newScheme) => {
  if (newScheme === 'dark') {
    document.documentElement.classList.add('ptoj-dark')
  } else {
    document.documentElement.classList.remove('ptoj-dark')
  }
}, { immediate: true })
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
  overflow-y: scroll
  text-autospace: normal
#app
  [class^="p-"], [class*=" p-"]
    line-height: normal !important
</style>
