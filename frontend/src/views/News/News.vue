<script setup>
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import { computed, onBeforeMount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useRootStore } from '@/store'
import { useNewsStore } from '@/store/modules/news'
import { useSessionStore } from '@/store/modules/session'

const { t } = useI18n()
const newsStore = useNewsStore()
const rootStore = useRootStore()
const route = useRoute()
const router = useRouter()
const current = computed(() => route.name || 'newsInfo')
const { isAdmin } = storeToRefs(useSessionStore())

function change (name) {
  return router.push({
    name,
    params: { nid: route.params.nid },
  })
}

onBeforeMount(async () => {
  await newsStore.findOne(route.params)
  rootStore.changeDomTitle({ title: `${newsStore.news.title} - News` })
})
</script>

<template>
  <div class="news-wrap">
    <div v-if="isAdmin" class="flex items-center justify-end px-8">
      <Button v-if="current === 'newsInfo'" :label="t('oj.edit')" icon="pi pi-pencil" @click="change('newsEdit')" />
      <Button v-else :label="t('oj.overview')" icon="pi pi-eye" @click="change('newsInfo')" />
    </div>
    <RouterView class="news-children" />
  </div>
</template>

<style lang="stylus" scoped>
.news-wrap
  width 100%
  max-width 1024px
  padding 24px 0 0

.news-children
  margin-top -16px
  padding 40px

@media screen and (max-width: 1024px)
  .news-wrap
    padding 12px 0 0

  .news-children
    padding 20px
</style>
