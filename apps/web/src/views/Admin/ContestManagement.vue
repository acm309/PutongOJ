<script setup lang="ts">
import type { AdminContestListQuery, AdminContestListQueryResult } from '@putong-oj/shared'
import { AdminContestListQuerySchema } from '@putong-oj/shared'
import { storeToRefs } from 'pinia'
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
import { useRootStore } from '@/store'
import { timePretty } from '@/utils/format'
import { onRouteQueryUpdate } from '@/utils/helper'
import { useMessage } from '@/utils/message'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const message = useMessage()
const rootStore = useRootStore()
const { currentTime } = storeToRefs(rootStore)

const query = ref({} as AdminContestListQuery)
const docs = ref([] as AdminContestListQueryResult['docs'])
const total = ref(0)
const loading = ref(false)
const createDialog = ref(false)

const hasFilter = computed(() => {
  return Boolean(
    query.value.contestId
    || query.value.title
    || query.value.course !== undefined
    || query.value.isHidden !== undefined
    || query.value.isPublic !== undefined
    || query.value.isLocked !== undefined,
  )
})

const publicOptions = computed(() => [ {
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
  if (parsed.success) {
    query.value = parsed.data
  } else {
    router.replace({ query: {} })
    return
  }

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
      ...route.query,
      contestId: query.value.contestId ?? undefined,
      title: query.value.title || undefined,
      course: query.value.course ?? undefined,
      isHidden: query.value.isHidden === undefined ? undefined : String(query.value.isHidden),
      isPublic: query.value.isPublic === undefined ? undefined : String(query.value.isPublic),
      isLocked: query.value.isLocked === undefined ? undefined : String(query.value.isLocked),
      page: undefined,
    },
  })
}

function onReset () {
  router.replace({
    query: {
      ...route.query,
      contestId: undefined,
      title: undefined,
      course: undefined,
      isHidden: undefined,
      isPublic: undefined,
      isLocked: undefined,
      page: undefined,
    },
  })
}

function onSort (event: any) {
  router.replace({
    query: {
      ...route.query,
      sortBy: event.sortField || event.field || query.value.sortBy,
      sort: event.sortOrder || event.order || query.value.sort,
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
  <div class="max-w-384 p-0">
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

        <IconField>
          <InputNumber
            v-model="query.contestId" mode="decimal" fluid :placeholder="t('ptoj.filter_by_contest_id')"
            :min="1" :use-grouping="false" :disabled="loading" @keypress.enter="onSearch"
          />
          <InputIcon class="pi pi-hashtag" />
        </IconField>

        <IconField>
          <InputNumber
            v-model="query.course" mode="decimal" fluid :placeholder="t('ptoj.filter_by_course')" :min="-1"
            :use-grouping="false" :disabled="loading" @keypress.enter="onSearch"
          />
          <InputIcon class="pi pi-book" />
        </IconField>

        <Select
          v-model="query.isPublic" fluid :options="publicOptions" option-label="label" option-value="value"
          show-clear :placeholder="t('ptoj.filter_by_public')" :disabled="loading" @change="onSearch"
        />

        <Select
          v-model="query.isHidden" fluid :options="hiddenOptions" option-label="label" option-value="value"
          show-clear :placeholder="t('ptoj.filter_by_hidden')" :disabled="loading" @change="onSearch"
        />

        <Select
          v-model="query.isLocked" fluid :options="lockedOptions" option-label="label" option-value="value"
          show-clear :placeholder="t('ptoj.filter_by_locked')" :disabled="loading" @change="onSearch"
        />

        <div class="flex gap-2 items-center justify-end lg:col-span-3 md:col-span-2 xl:col-span-2">
          <Button
            icon="pi pi-plus" :label="t('ptoj.create_contest')" :disabled="loading"
            @click="createDialog = true"
          />
          <Button icon="pi pi-refresh" severity="secondary" outlined :disabled="loading" @click="fetch" />
          <Button
            icon="pi pi-filter-slash" severity="secondary" outlined :disabled="loading || !hasFilter"
            @click="onReset"
          />
          <Button :label="t('ptoj.search')" icon="pi pi-search" :disabled="loading" @click="onSearch" />
        </div>
      </div>
    </div>

    <DataTable
      class="-mb-px whitespace-nowrap" :value="docs" sort-mode="single" :sort-field="query.sortBy"
      :sort-order="query.sort" :lazy="true" :loading="loading" data-key="contestId" scrollable @sort="onSort"
    >
      <Column field="contestId" class="pl-8 text-center w-18" sortable>
        <template #header>
          <i class="pi pi-hashtag" />
        </template>
      </Column>

      <Column :header="t('ptoj.contest')" class="min-w-96">
        <template #body="{ data }">
          <span class="-my-1 flex gap-4 items-center justify-between">
            <Button :label="data.title" link fluid class="justify-start p-0" @click="openContest(data.contestId)" />
            <span class="flex gap-1 justify-end">
              <Tag v-if="data.isHidden" :value="t('ptoj.hidden')" severity="secondary" />
              <Tag v-if="data.isLocked" :value="t('ptoj.locked')" severity="danger" />
            </span>
          </span>
        </template>
      </Column>

      <Column :header="t('oj.course')" class="min-w-48">
        <template #body="{ data }">
          <span v-if="data.course">{{ data.course.name }}</span>
          <span v-else class="text-muted-color">—</span>
        </template>
      </Column>

      <Column class="text-center w-24">
        <template #header>
          <span class="text-center w-full">
            <i class="pi pi-calendar-clock" />
          </span>
        </template>
        <template #body="{ data }">
          <span v-if="new Date(currentTime) < new Date(data.startsAt)" class="font-bold text-blue-500">
            {{ t('ptoj.upcoming') }}
          </span>
          <span v-else-if="new Date(currentTime) < new Date(data.endsAt)" class="font-bold text-red-500">
            {{ t('ptoj.running') }}
          </span>
          <span v-else class="font-bold">{{ t('ptoj.ended') }}</span>
        </template>
      </Column>

      <Column class="text-center w-24">
        <template #header>
          <span class="text-center w-full">
            <i class="pi pi-key" />
          </span>
        </template>
        <template #body="{ data }">
          <Tag
            :value="data.isPublic ? t('ptoj.public') : t('ptoj.private')"
            :severity="data.isPublic ? 'success' : 'warn'" class="-my-2"
          />
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
