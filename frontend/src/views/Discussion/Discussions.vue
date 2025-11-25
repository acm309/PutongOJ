<script lang="ts" setup>
import type {
  DiscussionCreatePayload,
  DiscussionListQuery,
  DiscussionListQueryResult,
} from '@putongoj/shared'
import { DiscussionListQuerySchema, DiscussionType } from '@putongoj/shared'
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import IftaLabel from 'primevue/iftalabel'
import InputText from 'primevue/inputtext'
import Paginator from 'primevue/paginator'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { createDiscussion, findDiscussions } from '@/api/discussion'
import DiscussionTypeTag from '@/components/DiscussionTypeTag.vue'
import UserFilter from '@/components/UserFilter.vue'
import { useSessionStore } from '@/store/modules/session'
import { formatRelativeTime, spacing } from '@/utils/formate'
import { onRouteQueryUpdate } from '@/utils/helper'
import { useMessage } from '@/utils/message'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const message = useMessage()

const { isLogined, isAdmin } = storeToRefs(useSessionStore())
const query = ref({} as DiscussionListQuery)
const docs = ref([] as DiscussionListQueryResult['docs'])
const total = ref(0)
const loading = ref(false)
const creating = ref(false)
const createDialog = ref(false)
const createForm = ref({
  type: DiscussionType.PrivateClarification,
  title: '',
  content: '',
} as DiscussionCreatePayload)

const hasFilter = computed(() => {
  return Boolean(query.value.author)
})
const hasEntered = computed(() => {
  return Boolean(createForm.value.title.trim()) && Boolean(createForm.value.content.trim())
})

const discussionTypeOptions = computed(() => [ {
  value: DiscussionType.PrivateClarification,
  label: t('ptoj.clarification'),
  desc: t('ptoj.clarification_type_desc'),
  disabled: false,
}, {
  value: DiscussionType.PublicAnnouncement,
  label: t('ptoj.announcement'),
  desc: t('ptoj.announcement_type_desc'),
  disabled: !isAdmin.value,
}, {
  value: DiscussionType.OpenDiscussion,
  label: t('ptoj.discussion'),
  desc: t('ptoj.discussion_type_desc'),
  disabled: !isAdmin.value,
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

function onCreateDiscussion () {
  createDialog.value = true
}

async function submitDiscussion () {
  creating.value = true
  const resp = await createDiscussion(createForm.value)
  creating.value = false

  if (!resp.success) {
    message.error(t('ptoj.failed_create_discussion'), resp.message)
    return
  }

  const { discussionId } = resp.data
  message.success(
    t('ptoj.successful_create_discussion'),
    t('ptoj.successful_create_discussion_detail', { discussionId }),
  )
  router.push({ name: 'DiscussionDetail', params: { discussionId } })
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
          force-selection @select="onSearch"
        />

        <div class="flex gap-2 items-center justify-end lg:col-span-2 md:col-span-1">
          <Button icon="pi pi-refresh" severity="secondary" outlined :disabled="loading" @click="fetch" />
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

      <Column field="author.uid" class="max-w-36 md:max-w-48 text-right truncate">
        <template #header>
          <span class="font-semibold text-right w-full">
            {{ t('ptoj.author') }}
          </span>
        </template>
        <template #body="{ data }">
          <a @click="onViewAuthor(data)">
            {{ data.author.uid }}
          </a>
        </template>
      </Column>

      <Column field="comments" class="text-center whitespace-nowrap" sortable>
        <template #header>
          <span class="text-center w-full">
            <i class="pi pi-comments" />
          </span>
        </template>
      </Column>

      <Column field="lastCommentAt" class="pr-6 text-right whitespace-nowrap" sortable>
        <template #header>
          <span class="font-semibold text-right w-full">
            {{ t('ptoj.last_comment_at') }}
          </span>
        </template>
        <template #body="{ data }">
          {{ formatRelativeTime(data.lastCommentAt, locale) }}
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

    <Dialog
      v-model:visible="createDialog" :header="t('ptoj.create_discussion')" modal :closable="false"
      class="max-w-3xl mx-6 w-full"
    >
      <form @submit.prevent="submitDiscussion">
        <div class="space-y-4">
          <IftaLabel>
            <Select
              id="type" v-model="createForm.type" fluid :options="discussionTypeOptions" option-label="label"
              option-value="value" :option-disabled="(option) => option.disabled" required
            >
              <template #option="{ option }">
                <div class="flex gap-2 items-center">
                  <DiscussionTypeTag :type="option.value" />
                  <span class="text-muted text-sm">{{ option.desc }}</span>
                </div>
              </template>
            </Select>
            <label for="type">{{ t('ptoj.type') }}</label>
          </IftaLabel>
          <IftaLabel>
            <InputText
              id="title" v-model="createForm.title" fluid :placeholder="t('ptoj.enter_title')" maxlength="80"
              required
            />
            <label for="title">{{ t('ptoj.title') }}</label>
          </IftaLabel>
          <IftaLabel>
            <Textarea
              id="content" v-model="createForm.content" :placeholder="t('ptoj.enter_content')" required fluid
              rows="7" auto-resize
            />
            <label for="content">{{ t('ptoj.content') }}</label>
          </IftaLabel>
        </div>
        <div class="flex gap-2 justify-end mt-5">
          <Button
            type="button" :label="t('ptoj.cancel')" icon="pi pi-times" severity="secondary" outlined
            @click="createDialog = false"
          />
          <Button
            type="submit" :label="t('ptoj.submit_discussion')" icon="pi pi-send" :disabled="!hasEntered"
            :loading="creating"
          />
        </div>
      </form>
    </Dialog>
  </div>
</template>
