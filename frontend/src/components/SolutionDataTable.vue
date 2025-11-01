<script setup lang="ts" generic="T extends SolutionModelDataTable">
import type { JudgeStatus, Language } from '@putongoj/shared'
import type { SolutionModelDataTable } from '@/types'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Tag from 'primevue/tag'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { judgeStatusLabels, languageLabels } from '@/utils/constant'
import {
  getJudgeStatusClassname,
  getSimilarityClassname,
  thousandSeparator,
  timePretty,
} from '@/utils/formate'

const props = withDefaults(defineProps<{
  value: T[]
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
const selection = defineModel<T[]>('selection', {
  default: () => [],
})

const { t } = useI18n()
const router = useRouter()

function handleSort (event: any) {
  emit('sort', event)
}

function handleView (data: any) {
  router.push({ name: 'solution', params: { sid: data.sid } })
}
function handleViewUser (data: any) {
  router.push({ name: 'UserProfile', params: { uid: data.uid } })
}
function handleViewProblem (data: any) {
  router.push({ name: 'problemInfo', params: { pid: data.pid } })
}
function handleViewContest (data: any) {
  if (!data.mid || data.mid <= 0) return
  router.push({ name: 'contestOverview', params: { cid: data.mid } })
}
</script>

<template>
  <DataTable
    v-model:selection="selection" class="whitespace-nowrap" :value="props.value" sort-mode="single"
    :sort-field="props.sortField" :sort-order="props.sortOrder" data-key="sid" :lazy="true" :loading="props.loading"
    scrollable :selection-mode="props.selectable ? 'multiple' : undefined" @sort="handleSort"
  >
    <Column v-if="props.selectable" selection-mode="multiple" class="pl-6 w-10" frozen />

    <Column field="sid" class="font-medium text-center" :class="{ 'pl-6': !props.selectable }" frozen>
      <template #header>
        <span class="text-center w-full">
          <i class="pi pi-hashtag" />
        </span>
      </template>
      <template #body="{ data }">
        <a @click="handleView(data)">
          {{ data.sid }}
        </a>
      </template>
    </Column>

    <Column
      v-if="!props.hideUser" :header="t('ptoj.user')" field="uid"
      class="font-medium max-w-36 md:max-w-48 min-w-36 truncate"
    >
      <template #body="{ data }">
        <a @click="handleViewUser(data)">
          {{ data.uid }}
        </a>
      </template>
    </Column>

    <Column v-if="!props.hideProblem" field="pid" class="text-center">
      <template #header>
        <span class="font-semibold text-center w-full">
          {{ t('ptoj.problem') }}
        </span>
      </template>
      <template #body="{ data }">
        <slot name="problem" :data="data">
          <a @click="handleViewProblem(data)">
            {{ data.pid }}
          </a>
        </slot>
      </template>
    </Column>

    <Column v-if="!props.hideContest" field="mid" class="text-center">
      <template #header>
        <span class="font-semibold text-center w-full">
          {{ t('ptoj.contest') }}
        </span>
      </template>
      <template #body="{ data }">
        <a v-if="data.mid && data.mid > 0" @click="handleViewContest(data)">
          {{ data.mid }}
        </a>
        <span v-else>
          -
        </span>
      </template>
    </Column>

    <Column :header="t('ptoj.judge_status')" field="judge" class="py-1">
      <template #body="{ data }">
        <div class="flex items-center">
          <span :class="getJudgeStatusClassname(data.judge as JudgeStatus)">
            {{ judgeStatusLabels[data.judge as JudgeStatus] }}
          </span>
          <Tag v-if="data.sim" severity="secondary" class="ml-2 text-xs" :class="getSimilarityClassname(data.sim)">
            {{ data.sim }}%
          </Tag>
        </div>
      </template>
    </Column>

    <Column field="time" class="text-right" sortable>
      <template #header>
        <span class="font-semibold text-right w-full">
          {{ t('ptoj.time') }}
        </span>
      </template>
      <template #body="{ data }">
        {{ thousandSeparator(data.time) }} <small>ms</small>
      </template>
    </Column>

    <Column field="memory" class="text-right" sortable>
      <template #header>
        <span class="font-semibold text-right w-full">
          {{ t('ptoj.memory') }}
        </span>
      </template>
      <template #body="{ data }">
        {{ thousandSeparator(data.memory) }} <small>KB</small>
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
