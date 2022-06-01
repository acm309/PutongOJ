<script setup>
import { useRouter } from 'vue-router'
import { inject } from 'vue'
import { storeToRefs } from 'pinia'
import OjNewsEdit from '@/components/NewsEdit'
import { useNewsStore } from '@/store/modules/news'

const newsStore = useNewsStore()
const router = useRouter()
const $Message = inject('$Message')
const { news } = $(storeToRefs(newsStore))

async function submit () {
  if (news.title.length === 0) {
    $Message.error('Title is required')
    return
  }

  try {
    const nid = await newsStore.update(news)
    $Message.success(`News "${news.title}" has been updated!`)
    router.push({ name: 'newsInfo', params: { nid } })
  } catch (err) {
    $Message.error(err.message)
  }
}
</script>

<template>
  <div>
    <h1>修改消息</h1>
    <OjNewsEdit />
    <Button type="primary" size="large" @click="submit">
      Submit
    </Button>
  </div>
</template>

<style lang="stylus" scoped>
h1
  margin-bottom: 20px
.ivu-btn
  margin-top: 20px
</style>
