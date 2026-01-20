<script setup lang="ts">
import type { ContestListQueryResult } from '@putongoj/shared'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Tag from 'primevue/tag'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { timePretty } from '@/utils/formate'

const props = defineProps<{
  value: ContestListQueryResult['docs']
  sortField?: string
  sortOrder?: number
  loading?: boolean
}>()
const emit = defineEmits<{
  (e: 'sort', event: any): void
}>()

const { t } = useI18n()

enum ContestStatus {
  Upcoming,
  Running,
  Ended,
}

const statusLabels = computed(() => ({
  [ContestStatus.Upcoming]: t('ptoj.upcoming'),
  [ContestStatus.Running]: t('ptoj.running'),
  [ContestStatus.Ended]: t('ptoj.ended'),
} as Record<ContestStatus, string>))

function contestStatus (contest: { startsAt: string, endsAt: string }): ContestStatus {
  const now = Date.now()
  const startsAt = new Date(contest.startsAt).getTime()
  const endsAt = new Date(contest.endsAt).getTime()
  if (now < startsAt) {
    return ContestStatus.Upcoming
  } else if (now > endsAt) {
    return ContestStatus.Ended
  } else {
    return ContestStatus.Running
  }
}

function handleSort (event: any) {
  emit('sort', event)
}

function onRowSelect (_e: any) {
  /**
   * @TODO
   */
}
</script>

<template>
  <DataTable
    class="whitespace-nowrap" :value="props.value" sort-mode="single" :sort-field="props.sortField"
    :sort-order="props.sortOrder" data-key="contestId" :lazy="true" :loading="props.loading" scrollable
    selection-mode="single" @sort="handleSort"
    @row-select="onRowSelect"
  >
    <Column class="pl-8 text-center w-18" field="contestId" frozen>
      <template #header>
        <span class="text-center w-full">
          <i class="pi pi-hashtag" />
        </span>
      </template>
    </Column>

    <Column :header="t('ptoj.contest')" class="min-w-96">
      <template #body="{ data }">
        <span class="flex gap-4 items-center justify-between">
          <RouterLink class="text-pretty" :to="{ name: 'ContestOverview', params: { contestId: data.contestId } }">
            {{ data.title }}
          </RouterLink>
          <span class="-my-2 flex gap-1 justify-end">
            <Tag v-if="data.isHidden" :value="t('ptoj.hidden')" severity="secondary" />
          </span>
        </span>
      </template>
    </Column>

    <Column class="text-center w-24">
      <template #header>
        <span class="text-center w-full">
          <i class="pi pi-calendar-clock" />
        </span>
      </template>
      <template #body="{ data }">
        <span
          :class="{
            'text-blue-500': contestStatus(data) === ContestStatus.Upcoming,
            'text-red-500': contestStatus(data) === ContestStatus.Running,
          }" class="font-bold"
        >
          {{ statusLabels[contestStatus(data)] }}
        </span>
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

    <Column
      v-if="props.sortField !== 'endsAt'" field="startsAt" :header="t('ptoj.starts_at')" class="pr-6 w-48"
      :sortable="true"
    >
      <template #body="{ data }">
        {{ timePretty(data.startsAt) }}
      </template>
    </Column>

    <Column v-else field="endsAt" :header="t('ptoj.ends_at')" class="pr-6 w-48" :sortable="true">
      <template #body="{ data }">
        {{ timePretty(data.endsAt) }}
      </template>
    </Column>
  </DataTable>
</template>
