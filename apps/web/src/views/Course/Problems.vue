<script setup lang="ts">
import type { ProblemListQuery, ProblemListQueryResult, ProblemUpdatePayload } from '@putongoj/shared'
import { ProblemVisibility } from '@putongoj/shared'
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Paginator from 'primevue/paginator'
import Select from 'primevue/select'
import { useConfirm } from 'primevue/useconfirm'
import { computed, onBeforeMount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { moveCourseProblem, removeCourseProblem } from '@/api/course'
import ProblemTag from '@/components/ProblemTag.vue'
import { useCourseStore } from '@/store/modules/course'
import { useProblemStore } from '@/store/modules/problem'
import { useSessionStore } from '@/store/modules/session'
import { problemVisibilityLabels } from '@/utils/constant'
import { formatPercentage } from '@/utils/format'
import { onRouteQueryUpdate } from '@/utils/helper'
import { useMessage } from '@/utils/message'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const confirm = useConfirm()
const message = useMessage()
const sessionStore = useSessionStore()
const problemStore = useProblemStore()
const courseStore = useCourseStore()
const { isAdmin } = storeToRefs(sessionStore)
const { problems, solvedProblemIds } = storeToRefs(problemStore)
const { course } = storeToRefs(courseStore)
const { findProblems, update } = problemStore

const searchOptions = [
  { value: 'id', label: 'ID' },
  { value: 'title', label: 'Title' },
  { value: 'tag', label: 'Tag' },
]

const DEFAULT_PAGE_SIZE = 30
const MAX_PAGE_SIZE = 100

const page = computed<number>(() =>
  Math.max(Number.parseInt(route.query.page as string) || 1, 1))
const pageSize = computed<number>(() =>
  Math.max(Math.min(Number.parseInt(route.query.pageSize as string)
    || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE), 1))
const id = Number.parseInt(route.params.id as string)

const searchField = ref(String(route.query.searchField || 'id'))
const search = ref(String(route.query.search || ''))
const loading = ref(false)

const query = computed<ProblemListQuery>(() => {
  return {
    page: page.value,
    pageSize: pageSize.value,
    courseId: id,
    searchField: (route.query.searchField || searchField.value) as ProblemListQuery['searchField'],
    search: String(route.query.search || search.value),
  }
})

function reload (payload: Partial<ProblemListQuery> = {}) {
  const routeQuery = { ...query.value, ...payload }
  router.push({
    name: 'courseProblems',
    params: { id },
    query: routeQuery,
  })
}

async function fetch () {
  loading.value = true
  await findProblems(query.value)
  loading.value = false
}

const submitSearch = () => reload({ page: 1, searchField: searchField.value as ProblemListQuery['searchField'], search: search.value })
const pageChange = (val: number) => reload({ page: val })

async function switchStatus (problem: ProblemListQueryResult['items'][number]) {
  loading.value = true
  const visibility: ProblemUpdatePayload['visibility'] = problem.visibility === ProblemVisibility.RESERVED
    ? ProblemVisibility.AVAILABLE
    : ProblemVisibility.RESERVED
  await update(problem.id, { visibility })
  loading.value = false
  await fetch()
}

const sortingModal = ref(false)
const sorting = ref<ProblemListQueryResult['items'][number] | null>(null)
const newPosition = ref<number | null>(null)

async function updateSorting () {
  if (newPosition.value === null || newPosition.value < 1 || newPosition.value > problems.value.total + 1) {
    message.error(t('oj.invalid_position'))
    return
  }
  loading.value = true
  try {
    if (!course.value || !sorting.value) return
    await moveCourseProblem(course.value.id, sorting.value.id, {
      beforePosition: newPosition.value,
    })
    message.success(t('oj.problem_sorting_updated'))
    sortingModal.value = false
    await fetch()
  } catch (e: any) {
    message.error(t('oj.failed_to_update_sorting', { error: e.message }))
  } finally {
    loading.value = false
  }
}

function removeProblem (event: Event, problemId: number) {
  confirm.require({
    target: event.currentTarget as HTMLElement,
    message: '你确定要从该课程中移除该题目吗？',
    rejectProps: {
      label: '取消',
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: '确定',
      severity: 'danger',
    },
    accept: async () => {
      if (!course.value) return
      await removeCourseProblem(course.value.id, problemId)
      message.success('题目已从课程中移除')
      fetch()
    },
  })
}

onBeforeMount(fetch)
onRouteQueryUpdate(fetch)
</script>

<template>
  <div class="max-w-7xl p-0">
    <div class="border-b border-surface p-6">
      <div class="gap-4 grid grid-cols-1 items-end lg:grid-cols-3 md:grid-cols-2">
        <div class="flex gap-2">
          <Select
            v-model="searchField" class="w-36" fluid :options="searchOptions" option-label="label" option-value="value"
            :disabled="loading"
          />
          <InputText
            v-model="search" fluid placeholder="Enter search content..." :disabled="loading"
            @keypress.enter="submitSearch"
          />
        </div>

        <div class="flex gap-2 items-center justify-end lg:col-span-2 md:col-span-1">
          <Button icon="pi pi-refresh" severity="secondary" outlined :disabled="loading" @click="fetch" />
          <!-- <Button
            icon="pi pi-filter-slash" severity="secondary" outlined :disabled="loading"
            @click="() => reload({ page: 1, type: undefined, content: undefined })"
          /> -->
          <Button :label="t('oj.search')" icon="pi pi-search" :disabled="loading" @click="submitSearch" />
        </div>
      </div>
    </div>

    <DataTable class="-mb-px whitespace-nowrap" :value="problems.items" :lazy="true" :loading="loading" scrollable>
      <Column class="pl-8 text-center w-18">
        <template #body="{ data }">
          <span v-if="solvedProblemIds.includes(data.id)" class="text-emerald-500">
            <i class="pi pi-check" />
          </span>
          <span v-else>
            <i class="pi pi-minus text-muted-color text-sm/tight" />
          </span>
        </template>
      </Column>

      <Column class="px-2 text-center w-18" field="index">
        <template #header>
          <span class="text-center w-full">
            <i class="pi pi-hashtag" />
          </span>
        </template>
        <template #body="{ index }">
          {{ pageSize * (page - 1) + index + 1 }}
        </template>
      </Column>

      <Column class="px-2 text-center w-18" field="id" />

      <Column :header="t('ptoj.problem')">
        <template #body="{ data }">
          <span class="-my-1 flex gap-4 items-center justify-between">
            <RouterLink :to="{ name: 'problemInfo', params: { problemId: data.id } }" class="grow">
              <Button class="justify-start p-0" :label="data.title" fluid link />
            </RouterLink>
            <span v-if="data.tags.length > 0" class="flex gap-1 justify-end">
              <template v-for="(tag, tagIdx) in data.tags" :key="tagIdx">
                <ProblemTag
                  class="cursor-pointer" :color="tag.color" :name="tag.name"
                  @click="reload({ page: 1, searchField: 'tag', search: tag.name })"
                />
              </template>
            </span>
          </span>
        </template>
      </Column>

      <Column class="pr-6 w-42">
        <template #header>
          <span class="text-center w-full">
            <i class="pi pi-chart-pie" />
          </span>
        </template>
        <template #body="{ data }">
          <span class="flex gap-2 items-center">
            <span class="grow text-center text-muted-color text-sm">
              {{ data.solverCount }} / {{ data.submitterCount }}
            </span>
            <span class="min-w-18 text-right">
              {{ formatPercentage(data.solverCount, data.submitterCount) }}
            </span>
          </span>
        </template>
      </Column>

      <Column v-if="course?.role.canManageProblems || isAdmin" class="pr-5 text-center w-24">
        <template #body="{ data }">
          <span class="-my-1 flex justify-end">
            <Button
              v-tooltip.left="(isAdmin || data.isOwner) ? t('oj.click_to_change_status') : null" link
              class="grow mr-3 p-0" :disabled="!(isAdmin || data.isOwner)" :label="problemVisibilityLabels[data.visibility as keyof typeof problemVisibilityLabels]"
              @click="switchStatus(data)"
            />
            <Button icon="pi pi-sort" link class="p-0" @click="sortingModal = true; sorting = data" />
            <Button icon="pi pi-trash" link class="p-0 text-red-400" @click="event => removeProblem(event, data.id)" />
          </span>
        </template>
      </Column>

      <template #empty>
        <span class="px-2">
          {{ t('oj.empty_content') }}
        </span>
      </template>
    </DataTable>

    <Paginator
      class="border-surface border-t bottom-0 md:rounded-b-xl overflow-hidden sticky z-10"
      :first="(page - 1) * pageSize" :rows="pageSize" :total-records="problems.total"
      template="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
      :current-page-report-template="t('ptoj.paginator_report')"
      @page="(event: any) => pageChange(event.first / event.rows + 1)"
    />

    <Dialog v-model:visible="sortingModal" modal :header="t('oj.update_problem_sorting')" :style="{ width: '30rem' }">
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <label class="font-semibold">{{ t('oj.move_problem') }}</label>
          <InputText :model-value="sorting?.title ?? ''" disabled fluid />
        </div>
        <div class="flex flex-col gap-2">
          <label class="font-semibold">{{ t('oj.before_position') }}</label>
          <InputNumber
            v-model="newPosition" fluid show-buttons :min="1" :max="problems.total + 1"
            :placeholder="t('oj.enter_new_position')"
          />
        </div>
      </div>
      <template #footer>
        <Button :label="t('oj.cancel')" severity="secondary" outlined @click="sortingModal = false" />
        <Button :label="t('oj.confirm')" @click="updateSorting" />
      </template>
    </Dialog>
  </div>
</template>
