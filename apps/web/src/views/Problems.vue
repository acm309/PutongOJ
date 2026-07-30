<script setup lang="ts">
import type { ProblemListQuery, ProblemUpdatePayload } from '@putongoj/shared'
import { ProblemVisibility } from '@putongoj/shared'
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import InputText from 'primevue/inputtext'
import Paginator from 'primevue/paginator'
import Select from 'primevue/select'
import { computed, onBeforeMount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import ProblemTag from '@/components/ProblemTag.vue'
import { useProblemStore } from '@/store/modules/problem'
import { useSessionStore } from '@/store/modules/session'
import { problemVisibilityLabels } from '@/utils/constant'
import { formatPercentage } from '@/utils/format'
import { onProfileUpdate, onRouteQueryUpdate } from '@/utils/helper'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const problemStore = useProblemStore()
const sessionStore = useSessionStore()

const searchOptions = [
  { value: 'id', label: 'ID' },
  { value: 'title', label: 'Title' },
  { value: 'tag', label: 'Tag' },
]

const page = computed(() => Math.max(Number(route.query.page) || 1, 1))
const pageSize = computed(() => Math.max(Math.min(Number(route.query.pageSize) || 30, 100), 1))
const searchField = ref<NonNullable<ProblemListQuery['searchField']>>(
  (route.query.searchField as NonNullable<ProblemListQuery['searchField']>) || 'id',
)
const search = ref(String(route.query.search || ''))
const loading = ref(false)

const query = computed<ProblemListQuery>(() => ({
  page: page.value,
  pageSize: pageSize.value,
  searchField: searchField.value,
  search: search.value || undefined,
}))

const { problems, solvedProblemIds } = storeToRefs(problemStore)

function reload (payload: Partial<ProblemListQuery> = {}) {
  router.push({ name: 'problems', query: { ...query.value, ...payload } })
}

function resetFilters () {
  reload({
    page: 1,
    searchField: undefined,
    search: undefined,
  })
}

async function fetch () {
  loading.value = true
  searchField.value = (route.query.searchField as NonNullable<ProblemListQuery['searchField']>) || 'id'
  search.value = String(route.query.search || '')
  await problemStore.findProblems(query.value)
  loading.value = false
}

async function toggleVisibility (problem: typeof problems.value.items[number]) {
  const visibility: ProblemUpdatePayload['visibility'] = problem.visibility === ProblemVisibility.RESERVED
    ? ProblemVisibility.AVAILABLE
    : ProblemVisibility.RESERVED
  await problemStore.update(problem.id, { visibility })
  await fetch()
}

onBeforeMount(fetch)
onRouteQueryUpdate(fetch)
onProfileUpdate(fetch)
</script>

<template>
  <div class="max-w-7xl p-0">
    <div class="border-b border-surface p-6">
      <div class="flex font-semibold gap-4 items-center mb-4">
        <i class="p-[4.5px] pi pi-th-large text-2xl" />
        <h1 class="text-xl">
          {{ t('ptoj.problem') }}
        </h1>
      </div>

      <div class="gap-4 grid grid-cols-1 items-end lg:grid-cols-3 md:grid-cols-2">
        <div class="flex gap-2">
          <Select
            v-model="searchField" class="w-36" fluid :options="searchOptions" option-label="label" option-value="value"
            :disabled="loading"
          />
          <InputText
            v-model="search" fluid placeholder="Enter search content..." :disabled="loading"
            @keypress.enter="reload({ page: 1, searchField, search })"
          />
        </div>
        <div class="flex gap-2 items-center justify-end lg:col-span-2 md:col-span-1">
          <Button icon="pi pi-refresh" severity="secondary" outlined :disabled="loading" @click="fetch" />
          <Button icon="pi pi-filter-slash" severity="secondary" outlined :disabled="loading" @click="resetFilters" />
          <Button
            :label="t('ptoj.search')" icon="pi pi-search" :disabled="loading"
            @click="reload({ page: 1, searchField, search })"
          />
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
      <Column class="px-2 text-center w-18" field="id">
        <template #header>
          <span class="text-center w-full">
            <i class="pi pi-hashtag" />
          </span>
        </template>
      </Column>
      <Column :header="t('ptoj.problem')">
        <template #body="{ data }">
          <span class="-my-1 flex gap-4 items-center justify-between">
            <RouterLink :to="{ name: 'problemInfo', params: { problemId: data.id } }" class="grow">
              <Button class="justify-start p-0" :label="data.title" fluid link />
            </RouterLink>
            <span v-if="data.tags.length > 0" class="flex gap-1 justify-end">
              <ProblemTag
                v-for="tag in data.tags" :key="tag.id" class="cursor-pointer" :name="tag.name" :color="tag.color"
                @click="reload({ page: 1, searchField: 'tag', search: tag.name })"
              />
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
      <Column v-if="sessionStore.isAdmin || problems.items.some(item => item.isOwner)" class="pr-6 text-center w-30">
        <template #body="{ data }">
          <Button
            v-if="sessionStore.isAdmin || data.isOwner" v-tooltip.left="'Click to change status'" class="-my-1 p-0" link
            :label="problemVisibilityLabels[data.visibility as keyof typeof problemVisibilityLabels]"
            @click="toggleVisibility(data)"
          />
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
      :first="(page - 1) * pageSize" :rows="pageSize" :total-records="problems.total"
      template="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
      :current-page-report-template="t('ptoj.paginator_report')"
      @page="event => reload({ page: event.first / event.rows + 1 })"
    />
  </div>
</template>
