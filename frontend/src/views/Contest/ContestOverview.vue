<script setup lang="ts">
import { storeToRefs } from 'pinia'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useContestStore } from '@/store/modules/contest'
import { contestLabeling, formate } from '@/utils/formate'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const contestStore = useContestStore()
const { contest, overview, solved } = storeToRefs(contestStore)

const cid = computed(() => Number.parseInt(route.params.cid as string))

function onRowSelect (e: any) {
  if (e.data.invalid) {
    return
  }
  router.push({ name: 'contestProblem', params: { cid: cid.value, id: e.index + 1 } })
}
</script>

<template>
  <DataTable :value="overview" class="pb-4 pt-2 px-0 whitespace-nowrap" scrollable selection-mode="single" @row-select="onRowSelect">
    <Column class="pl-6 text-center w-24">
      <template #header>
        <span class="text-center w-full">
          <i class="pi pi-hashtag" />
        </span>
      </template>
      <template #body="{ index }">
        {{ contestLabeling(index + 1, contest.option?.labelingStyle) }}
      </template>
    </Column>
    <Column :header="t('ptoj.title')">
      <template #body="{ data, index }">
        <RouterLink v-if="!data.invalid" :to="{ name: 'contestProblem', params: { cid, id: index + 1 } }">
          {{ data.title }}
        </RouterLink>
        <span v-else>{{ t('oj.problem_invalid') }}</span>
      </template>
    </Column>
    <Column class="text-center w-16">
      <template #body="{ data }">
        <span v-if="solved.includes(data.pid)" class="flex justify-center text-primary">
          <i class="pi pi-check" />
        </span>
      </template>
    </Column>
    <Column class="pr-6 text-center w-48">
      <template #header>
        <span class="text-center w-full">
          <i class="pi pi-chart-pie" />
        </span>
      </template>
      <template #body="{ data }">
        <span v-if="!data.invalid">
          {{ formate(data.solve / (data.submit + 0.000001)) }}
          ({{ data.solve }} / {{ data.submit }})
        </span>
      </template>
    </Column>
  </DataTable>
</template>
