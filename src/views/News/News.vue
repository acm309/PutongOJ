<script setup>
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { onBeforeMount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSessionStore } from '@/store/modules/session'
import { useNewsStore } from '@/store/modules/news'
import { useRootStore } from '@/store'

const { t } = useI18n()
const newsStore = useNewsStore()
const rootStore = useRootStore()
const route = useRoute()
const router = useRouter()
const current = $computed(() => route.name || 'newsInfo')
const { isAdmin } = storeToRefs(useSessionStore())

let loading = $ref(false)

function change(name) {
  return router.push({
    name,
    params: { nid: route.params.nid },
  })
}

onBeforeMount(async () => {
  loading = true
  await newsStore.findOne(route.params)
  rootStore.changeDomTitle({ title: `${newsStore.news.title} - News` })
  loading = false
})
</script>

<template>
  <div class="news-wrap">
    <Tabs v-if="isAdmin" :model-value="current" @on-click="change">
      <TabPane :label="t('oj.overview')" name="newsInfo" />
      <TabPane :label="t('oj.edit')" name="newsEdit" />
    </Tabs>
    <router-view />
    <Spin size="large" fix :show="loading" class="wrap-loading" />
  </div>
</template>

<style lang="stylus" scoped>
.news-wrap
  width: 100%
  max-width: 1024px
  padding-top: 30px
@media screen and (max-width: 1024px)
  .news-wrap
    padding-top: 20px
</style>
