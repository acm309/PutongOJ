<script lang="ts" setup>
import type {
  DiscussionCreatePayload,
  DiscussionListQuery,
  DiscussionListQueryResult,
} from '@putongoj/shared'
import { DiscussionListQuerySchema, DiscussionType } from '@putongoj/shared'
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import IftaLabel from 'primevue/iftalabel'
import Inplace from 'primevue/inplace'
import InputText from 'primevue/inputtext'
import Menu from 'primevue/menu'
import Paginator from 'primevue/paginator'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { createDiscussion, findDiscussions } from '@/api/discussion'
import DiscussionTypeTag from '@/components/DiscussionTypeTag.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import UserFilter from '@/components/UserFilter.vue'
import { useSessionStore } from '@/store/modules/session'
import { formatRelativeTime, timePretty } from '@/utils/formate'
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

        <div class="flex gap-2 items-center justify-end md:col-span-1">
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

    <template v-else>
      <div v-for="doc in docs" :key="doc.discussionId" class="border-surface border-t flex flex-col gap-2 px-6 py-5">
        <div class="flex flex-nowrap gap-x-4 gap-y-1 justify-between">
          <router-link
            class="font-medium hover:text-primary overflow-hidden text-color text-ellipsis text-lg text-pretty"
            :to="{ name: 'DiscussionDetail', params: { discussionId: doc.discussionId } }"
          >
            {{ doc.title }}
          </router-link>
          <span class="grow pt-px text-nowrap">
            <span class="flex flex-wrap-reverse gap-1 justify-end">
              <router-link v-if="doc.contest" :to="{ name: 'contestOverview', params: { cid: doc.contest.cid } }">
                <Tag :value="doc.contest.cid" severity="secondary" class="cursor-pointer hover:" icon="pi pi-trophy" />
              </router-link>
              <router-link v-if="doc.problem" :to="{ name: 'problemInfo', params: { pid: doc.problem.pid } }">
                <Tag :value="doc.problem.pid" severity="secondary" class="cursor-pointer" icon="pi pi-flag" />
              </router-link>
              <Tag v-if="doc.pinned" class="min-h-[22px]" icon="pi pi-thumbtack" />
              <DiscussionTypeTag :type="doc.type" />
            </span>
          </span>
        </div>
        <div class="flex flex-wrap gap-x-6 gap-y-1 items-end justify-between text-nowrap">
          <router-link
            class="flex gap-2 hover:text-primary items-center text-muted-color"
            :to="{ name: 'UserProfile', params: { uid: doc.author.uid } }"
          >
            <UserAvatar class="h-6 w-6" shape="circle" :image="doc.author.avatar" />
            {{ doc.author.uid }}
          </router-link>
          <div class="flex gap-4 grow justify-end text-muted-color text-sm">
            <span class="flex gap-2">
              <i class="pi pi-comments text-sm" />
              {{ doc.comments }}
            </span>
            <span v-if="query.sortBy === 'createdAt'" class="flex gap-2">
              <i class="pi pi-calendar-plus text-sm" />
              <Inplace unstyled>
                <template #display>{{ formatRelativeTime(doc.createdAt, locale) }}</template>
                <template #content>{{ timePretty(doc.createdAt) }}</template>
              </Inplace>
            </span>
            <span v-else class="flex gap-2">
              <i class="pi pi-clock text-sm" />
              <Inplace unstyled>
                <template #display>{{ formatRelativeTime(doc.lastCommentAt, locale) }}</template>
                <template #content>{{ timePretty(doc.lastCommentAt) }}</template>
              </Inplace>
            </span>
          </div>
        </div>
      </div>
    </template>

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
