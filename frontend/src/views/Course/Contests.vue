<script setup lang="ts">
import type { ContestListQuery, ContestListQueryResult } from '@putongoj/shared'
import { ContestListQuerySchema } from '@putongoj/shared'
import Button from 'primevue/button'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Paginator from 'primevue/paginator'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { findContests } from '@/api/contest'
import ContestDataTable from '@/components/ContestDataTable.vue'
import SortingMenu from '@/components/SortingMenu.vue'
import { onRouteQueryUpdate } from '@/utils/helper'
import { useMessage } from '@/utils/message'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const message = useMessage()

const query = ref({} as ContestListQuery)
const docs = ref([] as ContestListQueryResult['docs'])
const total = ref(0)
const loading = ref(false)

const hasFilter = computed(() => {
  return Boolean(query.value.title)
})

const sortingOptions = computed(() => [ {
  label: t('ptoj.created_at'),
  value: 'createdAt',
  isTimeBased: true,
}, {
  label: t('ptoj.starts_at'),
  value: 'startsAt',
  isTimeBased: true,
}, {
  label: t('ptoj.ends_at'),
  value: 'endsAt',
  isTimeBased: true,
} ])

async function fetch () {
  const parsed = ContestListQuerySchema.safeParse({ ...route.query, course: route.params.id })
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

function onSort (event: any) {
  router.replace({
    query: {
      ...route.query,
      sortBy: event.sortField || event.field || query.value.sortBy,
      sort: event.sortOrder || event.order || query.value.sort,
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
      title: query.value.title,
      page: undefined,
    },
  })
}

function onReset () {
  router.replace({
    query: {
      ...route.query,
      title: undefined,
      page: undefined,
    },
  })
}

onMounted(fetch)
onRouteQueryUpdate(fetch)
</script>

<template>
  <div class="max-w-7xl p-0">
    <div class="border-b border-surface p-6">
      <div class="gap-4 grid grid-cols-1 items-end lg:grid-cols-3 md:grid-cols-2">
        <IconField>
          <InputIcon class="pi pi-search text-(--p-text-secondary-color)" />
          <InputText
            v-model="query.title" fluid :placeholder="t('ptoj.search_by_title')" maxlength="30"
            :disabled="loading" @keypress.enter="onSearch"
          />
        </IconField>

        <div class="flex gap-2 items-center justify-end lg:col-span-2 md:col-span-1">
          <Button icon="pi pi-refresh" severity="secondary" outlined :disabled="loading" @click="fetch" />
          <SortingMenu :options="sortingOptions" :field="query.sortBy" :order="query.sort" @sort="onSort" />
          <Button
            icon="pi pi-filter-slash" severity="secondary" outlined :disabled="loading || !hasFilter"
            @click="onReset"
          />
        </div>
      </div>
    </div>

    <template v-if="loading || docs.length === 0">
      <div class="flex gap-4 items-center justify-center px-6 py-24">
        <i v-if="loading" class="pi pi-spin pi-spinner text-2xl" />
        <span>{{ loading ? t('ptoj.loading') : t('ptoj.empty_content_desc') }}</span>
      </div>
    </template>

    <ContestDataTable
      v-else :value="docs" :sort-field="query.sortBy" :sort-order="query.sort" :loading="loading"
      @sort="onSort"
    />

    <Paginator
      class="border-surface border-t bottom-0 md:rounded-b-xl overflow-hidden sticky z-10"
      :first="(query.page - 1) * query.pageSize" :rows="query.pageSize" :total-records="total"
      template="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
      :current-page-report-template="t('ptoj.paginator_report')" @page="onPage"
    />
  </div>
</template>
