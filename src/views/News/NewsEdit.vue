<script setup>
import { useRouter } from 'vue-router'
import { inject } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import OjNewsEdit from '@/components/NewsEdit'
import { useNewsStore } from '@/store/modules/news'

const { t } = useI18n()
const newsStore = useNewsStore()
const router = useRouter()
const $Message = inject('$Message')
const { news } = $(storeToRefs(newsStore))

async function submit () {
  if (news.title.length === 0) {
    $Message.error(t('oj.title_is_required'))
    return
  }

  try {
    const nid = await newsStore.update(news)
    $Message.success(t('oj.news_has_been_updated', { title: news.title }))
    router.push({ name: 'newsInfo', params: { nid } })
  } catch (err) {
    $Message.error(err.message)
  }
}
</script>

<template>
  <div>
    <OjNewsEdit />
    <Button type="primary" size="large" @click="submit">
      {{ t('oj.submit') }}
    </Button>
  </div>
</template>

<style lang="stylus" scoped>
h1
  margin-bottom: 20px
.ivu-btn
  margin-top: 20px
</style>
