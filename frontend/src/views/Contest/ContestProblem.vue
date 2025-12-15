<script setup lang="ts">
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import { Spin } from 'view-ui-plus'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import Problem from '@/components/Problem.vue'
import { useContestStore } from '@/store/modules/contest'
import { useProblemStore } from '@/store/modules/problem'
import { contestLabeling } from '@/utils/formate'
import { onRouteParamUpdate } from '@/utils/helper'

const { t } = useI18n()
const route = useRoute()
const problemStore = useProblemStore()
const contestStore = useContestStore()

const { findOne: findOneProblem } = problemStore
const { problem } = $(storeToRefs(problemStore))
const { overview, contest, totalProblems } = $(storeToRefs(contestStore))

const proIndex = $computed(() => Number.parseInt(route.params.id as string))

let loading = $ref(false)

async function fetch () {
  loading = true
  await findOneProblem({ pid: overview[proIndex - 1].pid, cid: contest.cid })
  loading = false
}

fetch()
onRouteParamUpdate(fetch)
</script>

<template>
  <div class="p-6">
    <div class="flex flex-wrap gap-2">
      <RouterLink
        v-for="i in totalProblems" :key="i"
        :to="{ name: 'contestProblem', params: { cid: contest.cid, id: i } }"
      >
        <Button
          class="min-w-10" :severity="i === proIndex ? 'primary' : 'secondary'" :outlined="i !== proIndex"
          :disabled="overview[i - 1].invalid"
        >
          {{ contestLabeling(i, contest.option?.labelingStyle) }}
        </Button>
      </RouterLink>
    </div>
    <div>
      <Problem v-model="problem" class="p-4">
        <template #title>
          {{ contestLabeling(proIndex, contest.option?.labelingStyle) }}:
          {{ problem.title }}
        </template>
      </Problem>
      <RouterLink :to="{ name: 'contestSubmit', params: route.params }">
        <Button icon="pi pi-send" :label="t('oj.submit')" outlined />
      </RouterLink>
    </div>
    <Spin size="large" fix :show="loading" />
  </div>
</template>
