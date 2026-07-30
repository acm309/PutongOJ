<script setup lang="ts">
import type { JudgeStatus, Language } from '@putongoj/shared'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Tag from 'primevue/tag'
import { useI18n } from 'vue-i18n'
import { judgeStatusLabels, languageLabels } from '@/utils/constant'
import {
  getJudgeStatusClassname,
  getSimilarityClassname,
  thousandSeparator,
  timePretty,
} from '@/utils/format'

interface SolutionListItem {
  id: number
  user: { id: number, username: string, nickname: string }
  problemId?: number
  contestId?: number | null
  language: Language
  status: JudgeStatus
  timeUsedMs: number
  memoryUsedKb: number
  similarity: number
  createdAt: string
}

const props = withDefaults(defineProps<{
  value: SolutionListItem[]
  sortField?: string
  sortOrder?: number
  loading?: boolean
  selectable?: boolean
  hideUser?: boolean
  hideProblem?: boolean
  hideContest?: boolean
}>(), {
  sortField: undefined,
  sortOrder: undefined,
  loading: false,
  selectable: false,
  hideUser: false,
  hideProblem: false,
  hideContest: false,
})
const emit = defineEmits<{
  (e: 'sort', event: any): void
}>()
const selection = defineModel<SolutionListItem[]>('selection', {
  default: () => [],
})

const { t } = useI18n()

function handleSort (event: any) {
  emit('sort', event)
}
</script>

<template>
  <DataTable
    v-model:selection="selection" class="whitespace-nowrap" :value="props.value" sort-mode="single"
    :sort-field="props.sortField" :sort-order="props.sortOrder" data-key="id" :lazy="true" :loading="props.loading"
    scrollable :selection-mode="props.selectable ? 'multiple' : undefined" @sort="handleSort"
  >
    <Column v-if="props.selectable" selection-mode="multiple" class="pl-6 w-10" frozen />

    <Column field="id" class="font-medium text-center" :class="{ 'pl-6': !props.selectable }" frozen>
      <template #header>
        <span class="text-center w-full">
          <i class="pi pi-hashtag" />
        </span>
      </template>
      <template #body="{ data }">
        <RouterLink :to="{ name: 'solution', params: { submissionId: data.id } }">
          <Button class="-my-px p-0" link fluid :label="String(data.id)" />
        </RouterLink>
      </template>
    </Column>

    <Column
      v-if="!props.hideUser" :header="t('ptoj.user')" field="user.username"
      class="font-medium max-w-36 md:max-w-48 min-w-36 truncate"
    >
      <template #body="{ data }">
        <RouterLink :to="{ name: 'UserProfile', params: { username: data.user.username } }">
          <Button class="-my-px justify-start p-0" link fluid :label="data.user.username" />
        </RouterLink>
      </template>
    </Column>

    <Column v-if="!props.hideProblem" field="problemId" class="text-center">
      <template #header>
        <span class="font-semibold text-center w-full">
          {{ t('ptoj.problem') }}
        </span>
      </template>
      <template #body="{ data }">
        <slot name="problem" :data="data">
          <RouterLink :to="{ name: 'problemInfo', params: { problemId: data.problemId } }">
            <Button class="-my-px p-0" link fluid :label="String(data.problemId)" />
          </RouterLink>
        </slot>
      </template>
    </Column>

    <Column v-if="!props.hideContest" field="contestId" class="text-center">
      <template #header>
        <span class="font-semibold text-center w-full">
          {{ t('ptoj.contest') }}
        </span>
      </template>
      <template #body="{ data }">
        <RouterLink v-if="data.contestId && data.contestId > 0" :to="{ name: 'ContestOverview', params: { contestId: data.contestId } }">
          <Button class="-my-px p-0" link fluid :label="String(data.contestId)" />
        </RouterLink>
        <span v-else>
          -
        </span>
      </template>
    </Column>

    <Column :header="t('ptoj.judge_status')" field="status" class="py-1">
      <template #body="{ data }">
        <div class="flex items-center">
          <span :class="getJudgeStatusClassname(data.status as JudgeStatus)">
            {{ judgeStatusLabels[data.status as JudgeStatus] }}
          </span>
          <Tag
            v-if="data.similarity" v-tooltip.top="t('ptoj.similarity_detected')" :class="getSimilarityClassname(data.similarity)"
            severity="secondary" class="ml-2 text-xs"
          >
            {{ data.similarity }}%
          </Tag>
        </div>
      </template>
    </Column>

    <Column field="timeUsedMs" class="text-right" sortable>
      <template #header>
        <span class="font-semibold text-right w-full">
          {{ t('ptoj.time') }}
        </span>
      </template>
      <template #body="{ data }">
        {{ thousandSeparator(data.timeUsedMs) }} <small>ms</small>
      </template>
    </Column>

    <Column field="memoryUsedKb" class="text-right" sortable>
      <template #header>
        <span class="font-semibold text-right w-full">
          {{ t('ptoj.memory') }}
        </span>
      </template>
      <template #body="{ data }">
        {{ thousandSeparator(data.memoryUsedKb) }} <small>KB</small>
      </template>
    </Column>

    <Column field="language" class="text-center">
      <template #header>
        <span class="font-semibold text-center w-full">
          {{ t('ptoj.language') }}
        </span>
      </template>
      <template #body="{ data }">
        {{ languageLabels[data.language as Language] }}
      </template>
    </Column>

    <Column :header="t('ptoj.submitted_at')" field="createdAt" class="pr-6" sortable>
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
</template>
type SolutionListItem = AccountSubmissionListQueryResult['items'][number]
