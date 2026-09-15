<script setup lang="ts">
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import Problem from '@/components/Problem.vue'
import { useContestStore } from '@/store/modules/contest'
import { useProblemStore } from '@/store/modules/problem'
import { onRouteParamUpdate } from '@/utils/helper'

const { t } = useI18n()
const route = useRoute()
const problemStore = useProblemStore()
const contestStore = useContestStore()

const { findOne: findOneProblem } = problemStore
const { problem } = storeToRefs(problemStore)
const { contestId, problems, problemLabels } = storeToRefs(contestStore)

const problemId = computed(() => Number.parseInt(route.params.problemId as string))

async function fetch () {
  await findOneProblem({ pid: problemId.value, cid: contestId.value })
}

fetch()
onRouteParamUpdate(fetch)
</script>

<template>
  <div class="p-6">
    <div class="flex flex-wrap gap-2">
      <RouterLink
        v-for="p in problems" :key="p.problemId"
        :to="{ name: 'contestProblem', params: { contestId, problemId: p.problemId } }"
      >
        <Button
          class="min-w-10" :severity="p.problemId === problemId ? 'primary' : 'secondary'"
          :outlined="p.problemId !== problemId"
        >
          {{ problemLabels.get(p.problemId) }}
        </Button>
      </RouterLink>
    </div>
    <div>
      <Problem v-model="problem" class="p-4">
        <template #title>
          {{ problem.title }}
        </template>
      </Problem>
      <RouterLink :to="{ name: 'contestSubmit', params: route.params }">
        <Button icon="pi pi-send" :label="t('oj.submit')" outlined />
      </RouterLink>
    </div>
  </div>
</template>
