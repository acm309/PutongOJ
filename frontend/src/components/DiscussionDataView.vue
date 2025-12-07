<script setup lang="ts">
import type { DiscussionListQuery, DiscussionListQueryResult } from '@putongoj/shared'
import Inplace from 'primevue/inplace'
import Tag from 'primevue/tag'
import { useI18n } from 'vue-i18n'
import DiscussionTypeTag from '@/components/DiscussionTypeTag.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import { formatRelativeTime, timePretty } from '@/utils/formate'

const props = defineProps<{
  value: DiscussionListQueryResult['docs']
  query: DiscussionListQuery
  contestId?: number
  problemMap?: Map<number, number>
  problemLabels?: Map<number, string>
  hideProblemTag?: boolean
}>()

const { locale } = useI18n()
</script>

<template>
  <div v-for="doc in props.value" :key="doc.discussionId" class="border-surface border-t flex flex-col gap-2 px-6 py-5">
    <div class="flex flex-nowrap gap-x-4 gap-y-1 justify-between">
      <RouterLink
        class="font-medium hover:text-primary overflow-hidden text-color text-ellipsis text-lg text-pretty"
        :to="{ name: 'DiscussionDetail', params: { discussionId: doc.discussionId } }"
      >
        {{ doc.title }}
      </RouterLink>
      <span class="grow pt-px text-nowrap">
        <span class="flex flex-wrap-reverse gap-1 justify-end">
          <RouterLink
            v-if="!hideProblemTag && doc.contest && !props.contestId"
            :to="{ name: 'contestOverview', params: { cid: doc.contest.cid } }"
          >
            <Tag :value="doc.contest.cid" severity="secondary" class="cursor-pointer" icon="pi pi-trophy" />
          </RouterLink>
          <RouterLink
            v-if="props.contestId && doc.problem"
            :to="{ name: 'contestProblem', params: { cid: props.contestId, id: (props.problemMap?.get(doc.problem.pid) || 0) + 1 } }"
          >
            <Tag
              v-if="doc.problem" :value="props.problemLabels?.get(doc.problem.pid) || doc.problem.pid"
              severity="secondary" class="cursor-pointer" icon="pi pi-flag"
            />
          </RouterLink>
          <RouterLink v-else-if="doc.problem" :to="{ name: 'problemInfo', params: { pid: doc.problem.pid } }">
            <Tag :value="doc.problem.pid" severity="secondary" class="cursor-pointer" icon="pi pi-flag" />
          </RouterLink>
          <Tag v-if="doc.pinned" class="min-h-[22px]" icon="pi pi-thumbtack" />
          <DiscussionTypeTag :type="doc.type" />
        </span>
      </span>
    </div>
    <div class="flex flex-wrap gap-x-6 gap-y-1 items-end justify-between text-nowrap">
      <RouterLink
        class="flex gap-2 hover:text-primary items-center text-muted-color"
        :to="{ name: 'UserProfile', params: { uid: doc.author.uid } }"
      >
        <UserAvatar class="h-6 w-6" shape="circle" :image="doc.author.avatar" />
        {{ doc.author.uid }}
      </RouterLink>
      <div class="flex gap-4 grow justify-end text-muted-color text-sm">
        <span class="flex gap-2">
          <i class="pi pi-comments text-sm" />
          {{ doc.comments }}
        </span>
        <span v-if="props.query.sortBy === 'createdAt'" class="flex gap-2">
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
