<script setup lang="ts">
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useContestStore } from '@/store/modules/contest'
import { contestLabeling, formatPercentage } from '@/utils/format'

const { t } = useI18n()
const contestStore = useContestStore()
const { contest, contestId, problems } = storeToRefs(contestStore)

onMounted(contestStore.reloadContestIfNeeded)
</script>

<template>
  <DataTable :value="problems" class="max-w-5xl pb-4 pt-2 px-0 whitespace-nowrap" scrollable>
    <Column class="pl-8 text-center w-18">
      <template #body="{ data }">
        <span v-if="data.isSolved" class="text-emerald-500">
          <i class="pi pi-check" />
        </span>
        <span v-else>
          <i class="pi pi-minus text-muted-color text-sm/tight" />
        </span>
      </template>
    </Column>

    <Column class="px-2 text-center w-12">
      <template #header>
        <span class="text-center w-full">
          <i class="pi pi-hashtag" />
        </span>
      </template>
      <template #body="{ data }">
        {{ contestLabeling(data.index, contest.labelingStyle) }}
      </template>
    </Column>

    <Column :header="t('ptoj.problem')">
      <template #body="{ data }">
        <RouterLink :to="{ name: 'contestProblem', params: { contestId, problemId: data.problemId } }">
          <Button :label="data.title" link fluid class="-my-px justify-start p-0" />
        </RouterLink>
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

    <template #empty>
      <span class="px-2">
        {{ t('ptoj.empty_content_desc') }}
      </span>
    </template>
  </DataTable>
</template>
