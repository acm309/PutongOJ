<script setup lang="ts">
import type { FindProblemsParams } from '@/types/api'
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import InputText from 'primevue/inputtext'
import Paginator from 'primevue/paginator'
import Select from 'primevue/select'
import { computed, onBeforeMount, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import ProblemTag from '@/components/ProblemTag.vue'
import { useRootStore } from '@/store'
import { useProblemStore } from '@/store/modules/problem'
import { useSessionStore } from '@/store/modules/session'
import constant from '@/utils/constant'
import { formatPercentage } from '@/utils/format'
import { onProfileUpdate, onRouteQueryUpdate, purify } from '@/utils/helper'

const options = reactive([
  { value: 'pid', label: 'Pid' },
  { value: 'title', label: 'Title' },
  { value: 'tag', label: 'Tag' },
])

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const DEFAULT_PAGE_SIZE = 30
const MAX_PAGE_SIZE = 100

const page = computed<number>(() =>
  Math.max(Number.parseInt(route.query.page as string) || 1, 1))
const pageSize = computed<number>(() =>
  Math.max(Math.min(Number.parseInt(route.query.pageSize as string)
    || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE), 1))

const type = ref(route.query.type || 'pid')
const content = ref(String(route.query.content || ''))
const problemVisible = ref(constant.status)
const query = computed(() => purify({ type: type.value, content: content.value, page: page.value, pageSize: pageSize.value }))

const problemStore = useProblemStore()
const rootStore = useRootStore()
const sessionStore = useSessionStore()

const { problems, solved } = storeToRefs(problemStore)
const { status } = storeToRefs(rootStore)
const { isAdmin } = storeToRefs(sessionStore)
const { findProblems, update } = problemStore

const loading = ref(false)

function reload (payload = {}) {
  const routeQuery = purify(Object.assign({}, query, payload))
  router.push({ name: 'problems', query: routeQuery })
}

async function fetch () {
  loading.value = true
  type.value = route.query.type || 'pid'
  content.value = String(route.query.content || '')
  await findProblems(query.value as FindProblemsParams)
  loading.value = false
}

const search = () => reload({ page: 1, type: type.value, content: content.value })
const pageChange = (val: number) => reload({ page: val })

function change (problem: { pid: number, status: number }) {
  loading.value = true
  problem.status = problem.status === status.value.Reserve ? status.value.Available : status.value.Reserve
  update({ pid: problem.pid, status: problem.status }).then(fetch)
}

onBeforeMount(fetch)
onRouteQueryUpdate(fetch)
onProfileUpdate(fetch)
</script>

<template>
  <div class="max-w-7xl p-0">
    <div class="border-b border-surface p-6">
      <div class="flex font-semibold gap-4 items-center mb-4">
        <i class="pi pi-th-large text-2xl" />
        <h1 class="text-xl">
          {{ t('ptoj.problem') }}
        </h1>
      </div>

      <div class="gap-4 grid grid-cols-1 items-end lg:grid-cols-3 md:grid-cols-2">
        <div class="flex gap-2">
          <Select
            v-model="type" class="w-36" fluid :options="options" option-label="label" option-value="value"
            :disabled="loading"
          />
          <InputText
            v-model="content" fluid placeholder="Enter search content..." :disabled="loading"
            @keypress.enter="search"
          />
        </div>

        <div class="flex gap-2 items-center justify-end lg:col-span-2 md:col-span-1">
          <Button icon="pi pi-refresh" severity="secondary" outlined :disabled="loading" @click="fetch" />
          <Button
            icon="pi pi-filter-slash" severity="secondary" outlined :disabled="loading"
            @click="() => reload({ page: 1, type: undefined, content: undefined })"
          />
          <Button :label="t('ptoj.search')" icon="pi pi-search" :disabled="loading" @click="search" />
        </div>
      </div>
    </div>

    <DataTable class="-mb-px whitespace-nowrap" :value="problems.docs" :lazy="true" :loading="loading" scrollable>
      <Column class="pl-8 text-center w-18">
        <template #body="{ data }">
          <span v-if="solved.includes(data.pid)" class="text-emerald-500">
            <i class="pi pi-check" />
          </span>
          <span v-else>
            <i class="pi pi-minus text-muted-color text-sm/tight" />
          </span>
        </template>
      </Column>

      <Column class="px-2 text-center w-18" field="pid">
        <template #header>
          <span class="text-center w-full">
            <i class="pi pi-hashtag" />
          </span>
        </template>
      </Column>

      <Column :header="t('ptoj.problem')">
        <template #body="{ data }">
          <span class="flex gap-4 items-center justify-between">
            <RouterLink :to="{ name: 'problemInfo', params: { pid: data.pid } }">
              {{ data.title }}
            </RouterLink>
            <span class="-my-2 flex gap-1 justify-end">
              <template v-for="(tag, tagIdx) in data.tags" :key="tagIdx">
                <ProblemTag
                  class="cursor-pointer" :color="tag.color"
                  :name="tag.name"
                  @click="reload({ page: 1, type: 'tag', content: tag.name })"
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
              {{ data.solve }} / {{ data.submit }}
            </span>
            <span class="min-w-18 text-right">
              {{ formatPercentage(data.solve, data.submit) }}
            </span>
          </span>
        </template>
      </Column>

      <Column v-if="isAdmin || problems.docs.some(doc => doc.isOwner)" class="pr-6 text-center w-30">
        <template #body="{ data }">
          <a v-if="isAdmin || data.isOwner" v-tooltip.left="'Click to change status'" @click="change(data)">
            {{ problemVisible[(data.status as 0 | 2)] }}
          </a>
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
      @page="(event: any) => pageChange(event.first / event.rows + 1)"
    />
  </div>
</template>
