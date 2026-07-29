<script setup lang="ts">
import type { AdminContestListQuery, AdminContestListQueryResult } from '@putongoj/shared'
import { AdminContestListQuerySchema } from '@putongoj/shared'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Paginator from 'primevue/paginator'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { findContests } from '@/api/admin'
import ContestCreateDialog from '@/components/ContestCreateDialog.vue'
import { timePretty } from '@/utils/format'
import { onRouteQueryUpdate } from '@/utils/helper'
import { useMessage } from '@/utils/message'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const message = useMessage()

const query = ref({} as AdminContestListQuery)
const docs = ref([] as AdminContestListQueryResult['docs'])
const total = ref(0)
const loading = ref(false)
const createDialog = ref(false)

const booleanOptions = computed(() => [ {
  label: t('ptoj.public'),
  value: true,
}, {
  label: t('ptoj.private'),
  value: false,
} ])

const hiddenOptions = computed(() => [ {
  label: t('ptoj.hidden'),
  value: true,
}, {
  label: t('ptoj.visible'),
  value: false,
} ])

const lockedOptions = computed(() => [ {
  label: t('ptoj.locked'),
  value: true,
}, {
  label: t('ptoj.unlocked'),
  value: false,
} ])

async function fetch () {
  const parsed = AdminContestListQuerySchema.safeParse(route.query)
  if (!parsed.success) {
    router.replace({ query: {} })
    return
  }

  query.value = parsed.data
  loading.value = true
  const resp = await findContests(query.value)
  loading.value = false
  if (!resp.success) {
    message.error(t('ptoj.failed_fetch_contests'), resp.message)
    docs.value = []
    total.value = 0
    return
  }

  docs.value = resp.data.docs
  total.value = resp.data.total
}

function onSearch () {
  router.replace({
    query: {
      contestId: query.value.contestId,
      title: query.value.title || undefined,
      course: query.value.course,
      isHidden: query.value.isHidden === undefined ? undefined : String(query.value.isHidden),
      isPublic: query.value.isPublic === undefined ? undefined : String(query.value.isPublic),
      isLocked: query.value.isLocked === undefined ? undefined : String(query.value.isLocked),
    },
  })
}

function onReset () {
  router.replace({ query: {} })
}

function onSort (event: any) {
  router.replace({
    query: {
      ...route.query,
      sortBy: event.field || query.value.sortBy,
      sort: event.order || query.value.sort,
      page: undefined,
    },
  })
}

function onPage (event: { first: number, rows: number }) {
  router.replace({
    query: {
      ...route.query,
      page: event.first / event.rows + 1,
    },
  })
}

function openContest (contestId: number) {
  router.push({ name: 'ContestOverview', params: { contestId } })
}

function editContest (contestId: number) {
  router.push({ name: 'contestEdit', params: { contestId } })
}

onMounted(fetch)
onRouteQueryUpdate(fetch)
</script>

<template>
  <div class="max-w-[1440px] p-0">
    <div class="border-b border-surface p-6">
      <div class="flex font-semibold gap-4 items-center mb-4">
        <i class="p-[4.5px] pi pi-trophy text-2xl" />
        <h1 class="text-xl">
          {{ t('ptoj.contest_management') }}
        </h1>
      </div>

      <div class="gap-4 grid grid-cols-1 items-end lg:grid-cols-3 md:grid-cols-2 xl:grid-cols-4">
        <IconField>
          <InputIcon class="pi pi-search text-(--p-text-secondary-color)" />
          <InputText
            v-model="query.title" fluid :placeholder="t('ptoj.search_by_title')" maxlength="200"
            :disabled="loading" @keypress.enter="onSearch"
          />
        </IconField>

        <InputNumber
          v-model="query.contestId" fluid :placeholder="t('ptoj.enter_contest_id')" :min="1"
          :use-grouping="false" :disabled="loading" @keypress.enter="onSearch"
        />

        <InputNumber
          v-model="query.course" fluid :placeholder="t('ptoj.filter_by_course')" :min="-1"
          :use-grouping="false" :disabled="loading" @keypress.enter="onSearch"
        />

        <Select
          v-model="query.isPublic" fluid :options="booleanOptions" option-label="label" option-value="value"
          show-clear :placeholder="t('ptoj.public')" :disabled="loading" @change="onSearch"
        />

        <Select
          v-model="query.isHidden" fluid :options="hiddenOptions" option-label="label" option-value="value"
          show-clear :placeholder="t('ptoj.hidden')" :disabled="loading" @change="onSearch"
        />

        <Select
          v-model="query.isLocked" fluid :options="lockedOptions" option-label="label" option-value="value"
          show-clear :placeholder="t('ptoj.locked')" :disabled="loading" @change="onSearch"
        />

        <div class="flex gap-2 items-center justify-end lg:col-span-3 md:col-span-2">
          <Button icon="pi pi-plus" :label="t('ptoj.create_contest')" :disabled="loading" @click="createDialog = true" />
          <Button icon="pi pi-refresh" severity="secondary" outlined :disabled="loading" @click="fetch" />
          <Button icon="pi pi-filter-slash" severity="secondary" outlined :disabled="loading" @click="onReset" />
          <Button icon="pi pi-search" :label="t('ptoj.search')" :disabled="loading" @click="onSearch" />
        </div>
      </div>
    </div>

    <DataTable
      class="-mb-px whitespace-nowrap" :value="docs" sort-mode="single" :sort-field="query.sortBy"
      :sort-order="query.sort" :lazy="true" :loading="loading" data-key="contestId" scrollable @sort="onSort"
    >
      <Column field="contestId" class="font-medium pl-6 w-24" sortable>
        <template #header>
          <i class="pi pi-hashtag" />
        </template>
      </Column>

      <Column :header="t('ptoj.contest')" field="title" class="min-w-80" />

      <Column :header="t('oj.course')" class="min-w-48">
        <template #body="{ data }">
          <span v-if="data.course">{{ data.course.courseId }} · {{ data.course.name }}</span>
          <span v-else class="text-muted-color">—</span>
        </template>
      </Column>

      <Column :header="t('ptoj.status')" class="min-w-60">
        <template #body="{ data }">
          <div class="flex flex-wrap gap-1">
            <Tag :value="data.isPublic ? t('ptoj.public') : t('ptoj.private')" :severity="data.isPublic ? 'success' : 'warn'" />
            <Tag v-if="data.isHidden" :value="t('ptoj.hidden')" severity="secondary" />
            <Tag v-if="data.isLocked" :value="t('ptoj.locked')" severity="danger" />
          </div>
        </template>
      </Column>

      <Column :header="t('ptoj.starts_at')" field="startsAt" class="w-48" sortable>
        <template #body="{ data }">
          {{ timePretty(data.startsAt) }}
        </template>
      </Column>

      <Column :header="t('ptoj.ends_at')" field="endsAt" class="w-48" sortable>
        <template #body="{ data }">
          {{ timePretty(data.endsAt) }}
        </template>
      </Column>

      <Column :header="t('ptoj.updated_at')" field="updatedAt" class="pr-4 w-48" sortable>
        <template #body="{ data }">
          {{ timePretty(data.updatedAt) }}
        </template>
      </Column>

      <Column class="px-6 py-2 w-24">
        <template #body="{ data }">
          <div class="flex gap-1 items-center">
            <Button icon="pi pi-eye" text @click="openContest(data.contestId)" />
            <Button icon="pi pi-pencil" text @click="editContest(data.contestId)" />
          </div>
        </template>
      </Column>

      <template #empty>
        <span class="px-2">{{ t('ptoj.empty_content_desc') }}</span>
      </template>
    </DataTable>

    <Paginator
      class="border-surface border-t bottom-0 md:rounded-b-xl overflow-hidden sticky z-10"
      :first="(query.page - 1) * query.pageSize" :rows="query.pageSize" :total-records="total"
      template="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
      :current-page-report-template="t('ptoj.paginator_report')" @page="onPage"
    />

    <ContestCreateDialog v-model:visible="createDialog" />
  </div>
</template>
