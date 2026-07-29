<script setup lang="ts">
import type { AdminPostListQuery, AdminPostListQueryResult } from '@putongoj/shared'
import { AdminPostListQuerySchema } from '@putongoj/shared'
import Button from 'primevue/button'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Paginator from 'primevue/paginator'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { findPosts } from '@/api/admin'
import PostCreateDialog from '@/components/PostCreateDialog.vue'
import SortingMenu from '@/components/SortingMenu.vue'
import { timePretty } from '@/utils/format'
import { onRouteQueryUpdate } from '@/utils/helper'
import { useMessage } from '@/utils/message'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const message = useMessage()

const query = ref({} as AdminPostListQuery)
const docs = ref([] as AdminPostListQueryResult['docs'])
const total = ref(0)
const loading = ref(false)
const createDialog = ref(false)

const hasFilter = computed(() => {
  return Boolean(query.value.title)
})

const sortingOptions = computed(() => [ {
  label: t('ptoj.publishes_at'),
  value: 'publishesAt',
  isTimeBased: true,
}, {
  label: t('ptoj.created_at'),
  value: 'createdAt',
  isTimeBased: true,
}, {
  label: t('ptoj.updated_at'),
  value: 'updatedAt',
  isTimeBased: true,
} ])

async function fetch () {
  const parsed = AdminPostListQuerySchema.safeParse(route.query)
  if (!parsed.success) {
    router.replace({ query: {} })
    return
  }

  query.value = parsed.data
  loading.value = true
  const resp = await findPosts(query.value)
  loading.value = false

  if (!resp.success || !resp.data) {
    message.error('Failed to load posts', resp.message)
    docs.value = []
    total.value = 0
    return
  }

  docs.value = resp.data.docs
  total.value = resp.data.total
}

function onSearch () {
  router.replace({
    query: {
      ...route.query,
      title: query.value.title || undefined,
      page: undefined,
    },
  })
}

function onReset () {
  router.replace({
    query: {
      ...route.query,
      title: undefined,
      sortBy: undefined,
      sort: undefined,
      page: undefined,
    },
  })
}

function onSort (event: { field?: string, order?: number }) {
  router.replace({
    query: {
      ...route.query,
      sortBy: event.field || query.value.sortBy,
      sort: event.order || query.value.sort,
      page: undefined,
    },
  })
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
  <div class="max-w-6xl p-0">
    <div class="p-6">
      <div class="flex items-center justify-between mb-4">
        <div class="flex font-semibold gap-4 items-center">
          <i class="p-[4.5px] pi pi-megaphone text-2xl" />
          <h1 class="text-xl">
            {{ t('ptoj.post_management') }}
          </h1>
        </div>

        <Button icon="pi pi-plus" :label="t('ptoj.create_post')" :disabled="loading" @click="createDialog = true" />
      </div>

      <div class="gap-4 grid grid-cols-1 items-end md:grid-cols-2 xl:grid-cols-3">
        <IconField>
          <InputText
            v-model="query.title" fluid :placeholder="t('ptoj.title')"
            :disabled="loading" @keypress.enter="onSearch"
          />
          <InputIcon class="pi pi-search" />
        </IconField>

        <div class="flex gap-2 items-center justify-end xl:col-span-2">
          <Button icon="pi pi-refresh" severity="secondary" outlined :disabled="loading" @click="fetch" />
          <SortingMenu :options="sortingOptions" :field="query.sortBy" :order="query.sort" @sort="onSort" />
          <Button
            icon="pi pi-filter-slash" severity="secondary" outlined :disabled="loading || !hasFilter"
            @click="onReset"
          />
          <Button icon="pi pi-search" :label="t('ptoj.search')" :disabled="loading" outlined @click="onSearch" />
        </div>
      </div>
    </div>

    <div v-if="loading" class="border-surface border-t flex gap-3 items-center justify-center p-8 text-muted-color">
      <i class="pi pi-spin pi-spinner" />
      <span>{{ t('ptoj.loading') }}</span>
    </div>

    <template v-else-if="docs.length > 0">
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
            <span v-if="doc.isHidden" class="flex gap-2 items-center text-orange-400">
              <span class="pi pi-eye-slash" />
              <span>{{ t('ptoj.hidden') }}</span>
            </span>
            <span v-if="!doc.isPublished" class="flex gap-2 items-center text-yellow-500">
              <span class="pi pi-minus-circle" />
              <span>{{ t('ptoj.unpublished') }}</span>
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

    <div v-else class="border-surface border-t flex items-center justify-center p-8 text-muted-color">
      {{ t('ptoj.empty_content_desc') }}
    </div>

    <Paginator
      class="border-surface border-t bottom-0 md:rounded-b-xl overflow-hidden sticky z-10"
      :first="(query.page - 1) * query.pageSize" :rows="query.pageSize" :total-records="total"
      template="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
      :current-page-report-template="t('ptoj.paginator_report')" @page="onPage"
    />

    <PostCreateDialog v-model:visible="createDialog" />
  </div>
</template>
