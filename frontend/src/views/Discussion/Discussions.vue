<script setup lang="ts">
import type { DiscussionListQuery, DiscussionListQueryResult } from '@putongoj/shared'
import { DiscussionListQuerySchema } from '@putongoj/shared'
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import Paginator from 'primevue/paginator'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { findDiscussions } from '@/api/discussion'
import DiscussionCreateDialog from '@/components/DiscussionCreateDialog.vue'
import DiscussionDataView from '@/components/DiscussionDataView.vue'
import SortingMenu from '@/components/SortingMenu.vue'
import UserFilter from '@/components/UserFilter.vue'
import { useSessionStore } from '@/store/modules/session'
import { onRouteQueryUpdate } from '@/utils/helper'
import { useMessage } from '@/utils/message'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const message = useMessage()

const { isLogined, isAdmin } = storeToRefs(useSessionStore())
const query = ref({} as DiscussionListQuery)
const docs = ref([] as DiscussionListQueryResult['docs'])
const total = ref(0)
const loading = ref(false)
const createDialog = ref(false)

const hasFilter = computed(() => {
  return Boolean(query.value.author)
})

const sortingOptions = computed(() => [ {
  label: t('ptoj.last_comment_at'),
  value: 'lastCommentAt',
  isTimeBased: true,
}, {
  label: t('ptoj.total_comments'),
  value: 'comments',
}, {
  label: t('ptoj.created_at'),
  value: 'createdAt',
  isTimeBased: true,
} ])

async function fetch () {
  const parsed = DiscussionListQuerySchema.safeParse(route.query)
  if (parsed.success) {
    query.value = parsed.data
  } else {
    router.replace({ query: {} })
    return
  }

  loading.value = true
  const resp = await findDiscussions(query.value)
  loading.value = false
  if (!resp.success) {
    message.error(t('ptoj.failed_fetch_discussions'), resp.message)
    docs.value = []
    total.value = 0
    return
  }

  docs.value = resp.data.docs
  total.value = resp.data.total
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

function onSearch () {
  router.replace({
    query: {
      ...route.query,
      author: query.value.author,
      page: undefined,
    },
  })
}

function onReset () {
  router.replace({
    query: {
      ...route.query,
      author: undefined,
      page: undefined,
    },
  })
}

function onCreateDiscussion () {
  createDialog.value = true
}

onMounted(fetch)
onRouteQueryUpdate(fetch)
</script>

<template>
  <div class="max-w-4xl p-0">
    <div class="p-6">
      <div class="flex font-semibold gap-4 items-center mb-4">
        <i class="pi pi-comments text-2xl" />
        <h1 class="text-xl">
          {{ t('ptoj.discussions') }}
        </h1>
      </div>

      <div class="gap-4 grid grid-cols-1 items-end md:grid-cols-2">
        <UserFilter
          v-model="query.author" :disabled="loading" :placeholder="t('ptoj.filter_by_author')" force-selection
          @select="onSearch"
        />

        <div class="flex gap-2 items-center justify-end">
          <Button icon="pi pi-refresh" severity="secondary" outlined :disabled="loading" @click="fetch" />
          <SortingMenu :options="sortingOptions" :field="query.sortBy" :order="query.sort" @sort="onSort" />
          <Button
            icon="pi pi-filter-slash" severity="secondary" outlined :disabled="loading || !hasFilter"
            @click="onReset"
          />
          <Button
            v-tooltip.top="!isLogined ? t('ptoj.please_login_first') : undefined" icon="pi pi-plus"
            severity="primary" :label="t('ptoj.create_discussion')" :disabled="loading || !isLogined"
            @click="onCreateDiscussion"
          />
        </div>
      </div>
    </div>

    <template v-if="loading || docs.length === 0">
      <div class="border-surface border-t flex gap-4 items-center justify-center px-6 py-24">
        <i v-if="loading" class="pi pi-spin pi-spinner text-2xl" />
        <span>{{ loading ? t('ptoj.loading') : t('ptoj.empty_content_desc') }}</span>
      </div>
    </template>

    <DiscussionDataView v-else :value="docs" :query="query" />

    <Paginator
      class="border-surface border-t bottom-0 md:rounded-b-xl overflow-hidden sticky z-10"
      :first="(query.page - 1) * query.pageSize" :rows="query.pageSize" :total-records="total"
      template="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
      :current-page-report-template="t('ptoj.paginator_report')" @page="onPage"
    />

    <DiscussionCreateDialog v-model:visible="createDialog" :is-managed="isAdmin" />
  </div>
</template>
