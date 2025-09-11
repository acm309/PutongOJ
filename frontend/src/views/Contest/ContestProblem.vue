<script setup>
import { storeToRefs } from 'pinia'
import { Button, Space, Spin } from 'view-ui-plus'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import Problem from '@/components/Problem'
import { useContestStore } from '@/store/modules/contest'
import { useProblemStore } from '@/store/modules/problem'
import { contestLabeling } from '@/utils/formate'
import { onRouteParamUpdate } from '@/utils/helper'

const { t } = useI18n()
const problemStore = useProblemStore()
const contestStore = useContestStore()
const router = useRouter()
const route = useRoute()

const { findOne: findOneProblem } = problemStore
const { problem } = $(storeToRefs(problemStore))
const { overview, contest, totalProblems } = $(storeToRefs(contestStore))

const proIndex = $computed(() => Number.parseInt(route.params.id || 1))

let loading = $ref(false)

async function fetch () {
  loading = true
  await findOneProblem({ pid: overview[proIndex - 1].pid, cid: contest.cid })
  loading = false
}

function pageChange (val) {
  if (overview[val - 1].invalid) return
  router.push({ name: 'contestProblem', params: { cid: contest.cid, id: val } })
}
const submit = () => router.push({ name: 'contestSubmit', params: router.params })

fetch()
onRouteParamUpdate(fetch)
</script>

<template>
  <div class="contest-children">
    <Space class="problem-nav" wrap :size="[8, 8]">
      <Button
        v-for="i in totalProblems" :key="i" class="problem-nav-item"
        :type="i === proIndex ? 'primary' : 'default'" :disabled="overview[i - 1].invalid" @click="pageChange(i)"
      >
        {{ contestLabeling(i, contest.option?.labelingStyle) }}
      </Button>
    </Space>
    <div class="problem-content">
      <Problem v-model="problem">
        <template #title>
          {{ $route.params.id }}: {{ problem.title }}
        </template>
      </Problem>
      <Button class="problem-submit" shape="circle" icon="md-paper-plane" @click="submit">
        {{ t('oj.submit') }}
      </Button>
    </div>
    <Spin size="large" fix :show="loading" />
  </div>
</template>

<style lang="stylus" scoped>
.contest-children
  margin-top -16px
  padding 40px 0
  position relative
.problem-nav
  padding 0 40px
  .problem-nav-item
    padding 0 11.66px
.problem-content
  padding 20px 40px 0

@media screen and (max-width: 1024px)
  .contest-children
    padding 20px 0
  .problem-nav
    padding 0 20px
  .problem-content
    padding 10px 20px 0
</style>
