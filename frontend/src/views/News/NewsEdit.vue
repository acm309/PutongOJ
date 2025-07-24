<script setup>
import { storeToRefs } from 'pinia'
import { Button, Space } from 'view-ui-plus'
import { inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import OjNewsEdit from '@/components/NewsEdit'
import { useNewsStore } from '@/store/modules/news'

import { useSessionStore } from '@/store/modules/session'

const { t } = useI18n()
const newsStore = useNewsStore()
const sessionStore = useSessionStore()
const router = useRouter()
const $Message = inject('$Message')
const { news } = $(storeToRefs(newsStore))
const { isRoot } = $(storeToRefs(sessionStore))
const $Modal = inject('$Modal')

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

function del (nid) {
  return $Modal.confirm({
    title: '提示',
    content: '<p>此操作将永久删除该消息, 是否继续?</p>',
    onOk: async () => {
      await newsStore.delete({ nid })
      $Message.success(`成功删除 ${nid}！`)
      reload({ page: currentPage })
    },
    onCancel: () => {
      $Message.info('已取消删除！')
    },
  })
}

function switchVisible () {
  if (news.status === 2) {
    news.status = 0
  } else {
    news.status = 2
  }
}
</script>

<template>
  <div>
    <OjNewsEdit />
    <Space :size="20">
      <Button type="primary" size="large" @click="submit">
        {{ t('oj.submit') }}
      </Button>
      <Button v-if="isRoot" size="large" @click="switchVisible">
        {{ news.status === 2 ? 'Hide' : 'Show' }}
      </Button>
      <Button v-if="isRoot" size="large" @click.stop="del(news.nid)">
        {{ t('oj.delete') }}
      </Button>
    </Space>
  </div>
</template>

<style lang="stylus" scoped>
h1
  margin-bottom: 20px
.ivu-btn
  margin-top: 20px
</style>
