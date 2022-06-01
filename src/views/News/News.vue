<script setup>
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { onBeforeMount } from 'vue'
import { useSessionStore } from '@/store/modules/session'
import { useNewsStore } from '@/store/modules/news'
import { useRootStore } from '@/store'

const newsStore = useNewsStore()
const rootStore = useRootStore()
const route = useRoute()
const router = useRouter()
const current = $computed(() => route.name || 'newsInfo')
const { isAdmin } = storeToRefs(useSessionStore())

const change = name => router.push({
  name,
  params: { nid: route.params.nid },
})

onBeforeMount(() => {
  newsStore.findOne(route.params).then(() => {
    rootStore.changeDomTitle({ title: `News -- ${newsStore.news.title}` })
  })
})
</script>

<template>
  <div>
    <Tabs :model-value="current" @on-click="change">
      <TabPane label="Overview" name="newsInfo" />
      <TabPane v-if="isAdmin" label="Edit" name="newsEdit" />
    </Tabs>
    <router-view />
  </div>
</template>

<style lang="stylus">
</style>
