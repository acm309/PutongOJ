<script setup lang="ts">
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import { useConfirm } from 'primevue/useconfirm'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import OjNewsEdit from '@/components/NewsEdit.vue'
import { useNewsStore } from '@/store/modules/news'
import { useSessionStore } from '@/store/modules/session'
import { useMessage } from '@/utils/message'

const { t } = useI18n()
const newsStore = useNewsStore()
const sessionStore = useSessionStore()
const router = useRouter()
const confirm = useConfirm()
const message = useMessage()
const { news } = storeToRefs(newsStore)
const { isRoot } = storeToRefs(sessionStore)

async function submit () {
  if (news.value.title.length === 0) {
    message.error(t('oj.title_is_required'))
    return
  }

  try {
    const nid = await newsStore.update(news.value)
    message.success(t('oj.news_has_been_updated', { title: news.value.title }))
    router.push({ name: 'newsInfo', params: { nid } })
  } catch (err: any) {
    message.error(err.message)
  }
}

function del (event: Event) {
  return confirm.require({
    target: event.currentTarget as HTMLElement,
    message: '此操作不可恢复，确认删除？',
    rejectProps: {
      label: t('ptoj.cancel'),
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: t('ptoj.delete'),
      severity: 'danger',
    },
    accept: async () => {
      const { nid } = news.value
      await newsStore.delete({ nid })
      message.success(`成功删除 ${nid}！`)
      router.push({ name: 'Home' })
    },
  })
}

function switchVisible () {
  if (news.value.status === 2) {
    news.value.status = 0
  } else {
    news.value.status = 2
  }
}
</script>

<template>
  <div>
    <OjNewsEdit />

    <div class="flex justify-between mt-4">
      <Button :label="t('oj.submit')" icon="pi pi-send" @click="submit" />

      <span v-if="isRoot" class="flex space-x-2">
        <Button
          :label="news.status === 2 ? 'Hide' : 'Show'" :icon="news.status === 2 ? 'pi pi-eye-slash' : 'pi pi-eye'"
          severity="secondary" outlined @click="switchVisible"
        />
        <Button :label="t('ptoj.delete')" icon="pi pi-trash" severity="danger" outlined @click="del" />
      </span>
    </div>
  </div>
</template>
