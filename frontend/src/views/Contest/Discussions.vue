<script lang="ts" setup>
import type {
  DiscussionListQuery,
  DiscussionListQueryResult,
} from '@putongoj/shared'
import { DiscussionListQuerySchema } from '@putongoj/shared'
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import Menu from 'primevue/menu'
import Paginator from 'primevue/paginator'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { findContestDiscussions } from '@/api/contest'
import DiscussionCreateDialog from '@/components/DiscussionCreateDialog.vue'
import DiscussionDataView from '@/components/DiscussionDataView.vue'
import UserFilter from '@/components/UserFilter.vue'
import { useContestStore } from '@/store/modules/contest'
import { useSessionStore } from '@/store/modules/session'
import { onRouteQueryUpdate } from '@/utils/helper'
import { useMessage } from '@/utils/message'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const message = useMessage()

const { contestId, problemOptions, problemLabels, problemMap } = storeToRefs(useContestStore())
const { isLogined, isAdmin } = storeToRefs(useSessionStore())
const query = ref({} as DiscussionListQuery)
const docs = ref([] as DiscussionListQueryResult['docs'])
const total = ref(0)
const loading = ref(false)
const createDialog = ref(false)

const hasFilter = computed(() => {
  return Boolean(query.value.author)
})

const sortingMenu = ref<any>(null)
const sortingMenuItems = computed(() => [ {
  label: t('ptoj.sort_by'),
  items: [ {
    label: t('ptoj.last_comment_at'),
    checked: query.value.sortBy === 'lastCommentAt',
    command: () => onSort({ sortField: 'lastCommentAt' }),
  }, {
    label: t('ptoj.total_comments'),
    checked: query.value.sortBy === 'comments',
    command: () => onSort({ sortField: 'comments' }),
  }, {
    label: t('ptoj.created_at'),
    checked: query.value.sortBy === 'createdAt',
    command: () => onSort({ sortField: 'createdAt' }),
  } ],
}, {
  separator: true,
}, {
  label: t('ptoj.sort_order'),
  items: [ {
    label: query.value.sortBy === 'comments' ? t('ptoj.descending') : t('ptoj.newest'),
    icon: 'pi pi-sort-amount-down',
    checked: query.value.sort === -1,
    command: () => onSort({ sortOrder: -1 }),
  }, {
    label: query.value.sortBy === 'comments' ? t('ptoj.ascending') : t('ptoj.oldest'),
    icon: 'pi pi-sort-amount-up-alt',
    checked: query.value.sort === 1,
    command: () => onSort({ sortOrder: 1 }),
  } ],
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
  const resp = await findContestDiscussions(contestId.value, query.value)
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

function onSort (event: { sortField?: string, sortOrder?: number }) {
  router.replace({
    query: {
      ...route.query,
      sortBy: event.sortField || query.value.sortBy,
      sort: event.sortOrder || query.value.sort,
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
  <div class="-mt-5 p-0">
    <div class="p-6">
      <div class="gap-4 grid grid-cols-1 items-end lg:grid-cols-3 md:grid-cols-2">
        <UserFilter
          v-model="query.author" :disabled="loading" :placeholder="t('ptoj.filter_by_author')" force-selection
          @select="onSearch"
        />

        <div class="flex gap-2 items-center justify-end lg:col-span-2">
          <Button icon="pi pi-refresh" severity="secondary" outlined :disabled="loading" @click="fetch" />
          <Button
            type="button" severity="secondary" outlined
            :icon="query.sort === 1 ? 'pi pi-sort-amount-up' : 'pi pi-sort-amount-down'" @click="sortingMenu?.toggle"
          />
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

      <Menu ref="sortingMenu" :model="sortingMenuItems" :popup="true">
        <template #item="{ item, props }">
          <a class="flex items-center justify-between" v-bind="props.action">
            <span class="flex gap-2 items-center">
              <span v-if="item.icon" :class="item.icon" />
              <span>{{ item.label }}</span>
            </span>
            <span v-if="item.checked" class="pi pi-check" />
          </a>
        </template>
      </Menu>
    </div>

    <template v-if="loading || docs.length === 0">
      <div class="border-surface border-t flex gap-4 items-center justify-center px-6 py-24">
        <i v-if="loading" class="pi pi-spin pi-spinner text-2xl" />
        <span>{{ loading ? t('ptoj.loading') : t('ptoj.empty_content_desc') }}</span>
      </div>
    </template>

    <DiscussionDataView
      v-else :value="docs" :query="query" :contest-id="contestId"
      :problem-labels="problemLabels" :problem-map="problemMap"
    />

    <Paginator
      class="border-surface border-t bottom-0 md:rounded-b-xl overflow-hidden sticky z-10"
      :first="(query.page - 1) * query.pageSize" :rows="query.pageSize" :total-records="total"
      template="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
      :current-page-report-template="t('ptoj.paginator_report')" @page="onPage"
    />

    <DiscussionCreateDialog
      v-model:visible="createDialog" :contest="contestId" :problem-options="problemOptions"
      :is-managed="isAdmin"
    />
  </div>
</template>
