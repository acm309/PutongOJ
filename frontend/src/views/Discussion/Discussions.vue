<script lang="ts" setup>
import type {
  DiscussionListQuery,
  DiscussionListQueryResult,
  DiscussionType,
} from '@putongoj/shared'
import { DiscussionListQuerySchema } from '@putongoj/shared'
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Paginator from 'primevue/paginator'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { findDiscussions } from '@/api/discussion'
import DiscussionTypeTag from '@/components/DiscussionTypeTag.vue'
import UserFilter from '@/components/UserFilter.vue'
import { useSessionStore } from '@/store/modules/session'
import { formatRelativeTime, spacing, timePretty } from '@/utils/formate'
import { onRouteQueryUpdate } from '@/utils/helper'
import { useMessage } from '@/utils/message'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const message = useMessage()

const { isLogined: _WIP_ } = storeToRefs(useSessionStore())
const query = ref({} as DiscussionListQuery)
const docs = ref([] as DiscussionListQueryResult['docs'])
const total = ref(0)
const loading = ref(false)

const hasFilter = computed(() => {
  return Boolean(query.value.author)
})

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

function onSort (event: any) {
  router.replace({
    query: {
      ...route.query,
      sortBy: event.sortField,
      sort: event.sortOrder,
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

function onViewDetail (data: any) {
  const { discussionId } = data
  router.push({ name: 'DiscussionDetail', params: { discussionId } })
}

function onViewAuthor (data: any) {
  const { author: { uid } } = data
  router.push({ name: 'UserProfile', params: { uid } })
}

onMounted(fetch)
onRouteQueryUpdate(fetch)
</script>

<template>
  <div class="max-w-7xl p-0">
    <div class="border-b border-surface p-6">
      <div class="flex font-semibold gap-4 items-center mb-4">
        <i class="pi pi-comments text-2xl" />
        <h1 class="text-xl">
          {{ t('ptoj.discussions') }}
        </h1>
      </div>
      <div class="gap-4 grid grid-cols-1 items-end lg:grid-cols-3 md:grid-cols-2">
        <UserFilter
          v-model="query.author" :disabled="loading" :placeholder="t('ptoj.filter_by_author')"
          @select="onSearch"
        />

        <div class="flex gap-2 items-center justify-end lg:col-span-2 md:col-span-1">
          <Button icon="pi pi-refresh" severity="secondary" outlined :disabled="loading" @click="fetch" />
          <Button
            icon="pi pi-filter-slash" severity="secondary" outlined :disabled="loading || !hasFilter"
            @click="onReset"
          />
        </div>
      </div>
    </div>

    <DataTable
      class="-mb-px" :value="docs" sort-mode="single" :sort-field="query.sortBy" :sort-order="query.sort"
      :lazy="true" :loading="loading" scrollable @sort="onSort"
    >
      <Column :header="t('ptoj.type')" field="type" class="pl-6 py-2 whitespace-nowrap">
        <template #body="{ data }">
          <DiscussionTypeTag :type="(data.type as DiscussionType)" />
        </template>
      </Column>

      <Column :header="t('ptoj.title')" field="title" class="font-medium min-w-xs">
        <template #body="{ data }">
          <a class="cursor-pointer hover:text-primary" @click="onViewDetail(data)">
            {{ spacing(data.title) }}
          </a>
        </template>
      </Column>

      <Column :header="t('ptoj.author')" field="author.uid" class="max-w-36 md:max-w-48 truncate">
        <template #body="{ data }">
          <a @click="onViewAuthor(data)">
            {{ data.author.uid }}
          </a>
        </template>
      </Column>

      <Column :header="t('ptoj.updated_at')" field="updatedAt" class="whitespace-nowrap" sortable>
        <template #body="{ data }">
          {{ formatRelativeTime(data.updatedAt, locale) }}
        </template>
      </Column>

      <Column :header="t('ptoj.created_at')" field="createdAt" class="pr-6 whitespace-nowrap" sortable>
        <template #body="{ data }">
          {{ timePretty(data.createdAt) }}
        </template>
      </Column>

      <template #empty>
        <span class="px-2">
          {{ t('ptoj.empty_content_desc') }}
        </span>
      </template>
    </DataTable>

    <Paginator
      class="border-surface border-t bottom-0 md:rounded-b-xl overflow-hidden sticky z-10"
      :first="(query.page - 1) * query.pageSize" :rows="query.pageSize" :total-records="total"
      template="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
      :current-page-report-template="t('ptoj.paginator_report')" @page="onPage"
    />
  </div>
</template>
