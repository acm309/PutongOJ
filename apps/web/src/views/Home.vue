<script setup lang="ts">
import type { PostListQueryResult } from '@putongoj/shared'
import { PostListQuerySchema } from '@putongoj/shared'
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import Paginator from 'primevue/paginator'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { findPosts } from '@/api/post'
import { useSessionStore } from '@/store/modules/session'
import { timePretty } from '@/utils/format'
import { onRouteQueryUpdate } from '@/utils/helper'
import { useMessage } from '@/utils/message'

const { locale, t } = useI18n()
const route = useRoute()
const router = useRouter()
const message = useMessage()
const sessionStore = useSessionStore()
const { isAdmin } = storeToRefs(sessionStore)

const zhCN = computed(() => locale.value === 'zh-CN')
const query = ref(PostListQuerySchema.parse({}))

const docs = ref([] as PostListQueryResult['docs'])
const total = ref(0)
const loading = ref(false)

async function fetch () {
  const parsed = PostListQuerySchema.safeParse(route.query)
  if (!parsed.success) {
    router.replace({ query: {} })
    return
  }
  query.value = parsed.data

  loading.value = true
  const resp = await findPosts(query.value)
  loading.value = false

  if (!resp.success || !resp.data) {
    message.error(t('ptoj.empty_content_desc'), resp.message)
    docs.value = []
    total.value = 0
    return
  }

  docs.value = resp.data.docs
  total.value = resp.data.total
}

function onPage (event: any) {
  router.replace({
    query: {
      ...route.query,
      page: (event.first / event.rows + 1),
    },
  })
}

onMounted(fetch)
onRouteQueryUpdate(fetch)
</script>

<template>
  <div class="bg-transparent border-none flex flex-col gap-0 lg:gap-4 max-w-4xl md:gap-2 p-0 shadow-none">
    <div
      class="-mb-px bg-(--p-content-background) border border-surface lg:shadow-lg md:mb-0 md:p-12 md:rounded-xl md:shadow-md overflow-hidden p-8 relative"
    >
      <div class="flex flex-col gap-2 relative text-color z-10">
        <p class="md:text-xl opacity-90 text-lg">
          {{ zhCN ? '欢迎访问' : 'Welcome to' }}
        </p>
        <h2 class="font-bold text-3xl">
          {{ zhCN ? '中国计量大学程序设计教学平台' : 'China Jiliang University Online Judge' }}
        </h2>
      </div>
      <div class="-right-10 -top-10 absolute bg-linear-to-tr from-primary h-40 opacity-10 rounded-full to-primary/0 w-40" />
      <div class="-bottom-20 -left-15 absolute bg-linear-to-bl from-primary h-60 opacity-10 rounded-full to-primary/0 w-60" />
    </div>

    <div class="bg-(--p-content-background) border border-surface md:rounded-xl shadow-lg">
      <div class="flex items-center justify-between p-6">
        <div class="flex font-semibold gap-4 items-center">
          <i class="p-[4.5px] pi pi-megaphone text-2xl" />
          <h1 class="text-xl">
            {{ t('ptoj.announcements') }}
          </h1>
        </div>

        <RouterLink v-if="isAdmin" :to="{ name: 'PostManagement' }">
          <Button icon="pi pi-cog" severity="secondary" variant="outlined" :label="t('ptoj.post_management')" />
        </RouterLink>
      </div>

      <template v-if="loading || docs.length === 0">
        <div class="border-surface border-t flex gap-4 items-center justify-center px-6 py-24">
          <i v-if="loading" class="pi pi-spin pi-spinner text-2xl" />
          <span>{{ loading ? t('ptoj.loading') : t('ptoj.empty_content_desc') }}</span>
        </div>
      </template>

      <template v-else>
        <div v-for="doc in docs" :key="doc.slug" class="border-surface border-t p-2">
          <RouterLink :to="{ name: 'PostDetail', params: { slug: doc.slug } }" class="block group px-4 py-3 space-y-2">
            <div class="flex gap-4 text-muted-color text-sm">
              <span class="flex gap-2 items-center">
                <span class="pi pi-calendar" />
                <span>{{ timePretty(doc.publishesAt, 'yyyy-MM-dd HH:mm') }}</span>
              </span>
              <span v-if="doc.isPinned" class="flex gap-2 items-center text-primary">
                <span class="pi pi-thumbtack" />
                <span>{{ t('ptoj.pinned') }}</span>
              </span>
            </div>
            <p
              class="font-medium group-hover:text-primary overflow-hidden text-ellipsis text-lg text-pretty transition-colors"
            >
              {{ doc.title }}
            </p>
          </RouterLink>
        </div>
      </template>

      <Paginator
        class="border-surface border-t bottom-0 md:rounded-b-xl overflow-hidden sticky z-10"
        :first="(query.page - 1) * query.pageSize" :rows="query.pageSize" :total-records="total"
        template="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
        :current-page-report-template="t('ptoj.paginator_report')" @page="onPage"
      />
    </div>
  </div>
</template>
