<script setup>
import Button from 'primevue/button'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import OjNewsEdit from '@/components/NewsEdit'
import { useNewsStore } from '@/store/modules/news'
import { useMessage } from '@/utils/message'

const newsStore = useNewsStore()
const { create } = newsStore
const message = useMessage()
const router = useRouter()
const { t } = useI18n()

const addNews = $ref({
  title: '',
  content: '',
})

async function submit () {
  const nid = await create(addNews)
  message.success(t('oj.create_news_success', { nid }))
  router.push({ name: 'newsInfo', params: { nid } })
}
newsStore.setCurrentNews($$(addNews))
</script>

<template>
  <div class="news-wrap">
    <h1>{{ t('oj.add_news') }}</h1>
    <OjNewsEdit />
    <Button :label="t('oj.submit')" class="mt-4" @click="submit" />
  </div>
</template>

<style lang="stylus" scoped>
.news-wrap
  max-width 1024px
h1
  margin-bottom: 20px
</style>
