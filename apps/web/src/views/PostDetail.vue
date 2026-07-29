<script setup lang="ts">
import type { PostDetailQueryResult } from '@putongoj/shared'
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { getPost } from '@/api/post'
import MarkdownPreview from '@/components/MarkdownPreview.vue'
import { useSessionStore } from '@/store/modules/session'
import { timePretty } from '@/utils/format'
import { useMessage } from '@/utils/message'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const message = useMessage()
const { isAdmin } = storeToRefs(useSessionStore())

const post = ref<PostDetailQueryResult | null>(null)
const loading = ref(false)

async function fetchPost () {
  loading.value = true
  const resp = await getPost(String(route.params.slug))
  loading.value = false

  if (!resp.success || !resp.data) {
    message.error(resp.message)
    router.replace({ name: 'home' })
    return
  }

  post.value = resp.data
}

onMounted(fetchPost)
watch(() => route.params.slug, fetchPost)
</script>

<template>
  <div class="max-w-6xl p-0">
    <div class="flex items-center justify-between pt-6 px-6">
      <div class="flex font-semibold gap-4 items-center">
        <i class="p-[4.5px] pi pi-megaphone text-2xl" />
        <h1 class="text-xl">
          {{ (!post || post.isHidden) ? t('ptoj.post') : t('ptoj.announcement') }}
        </h1>
      </div>

      <RouterLink v-if="isAdmin && post" :to="{ name: 'PostManagementDetail', params: { slug: post.slug } }">
        <Button :label="t('ptoj.edit_post')" icon="pi pi-pencil" />
      </RouterLink>
    </div>

    <template v-if="loading || !post">
      <div class="flex gap-4 items-center justify-center px-6 py-24">
        <i v-if="loading" class="pi pi-spin pi-spinner text-2xl" />
        <span>{{ loading ? t('ptoj.loading') : t('ptoj.failed_fetch_data') }}</span>
      </div>
    </template>

    <template v-else>
      <div class="p-12">
        <div class="max-w-xl mx-auto text-center">
          <h1 class="font-bold mb-2 text-4xl/snug text-pretty">
            {{ post.title }}
          </h1>
          <span class="text-muted-color">
            {{ timePretty(post.publishesAt, 'yyyy-MM-dd HH:mm') }}
          </span>
        </div>
        <MarkdownPreview :model-value="post.content" class="pb-4 pt-8" />
      </div>
    </template>
  </div>
</template>
