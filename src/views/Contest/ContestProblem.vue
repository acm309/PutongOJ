<script setup>
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Problem from '@/components/Problem'
import { useProblemStore } from '@/store/modules/problem'
import { useContestStore } from '@/store/modules/contest'
import { onRouteParamUpdate } from '@/util/helper'

const { t } = useI18n()
const problemStore = useProblemStore()
const contestStore = useContestStore()
const router = useRouter()
const route = useRoute()

const { findOne: findOneProblem } = problemStore
const { problem } = $(storeToRefs(problemStore))
const { overview, contest, totalProblems } = $(storeToRefs(contestStore))

const proIndex = $computed(() => Number.parseInt(route.params.id || 1))

function fetch () {
  findOneProblem({ pid: overview[proIndex - 1].pid, cid: contest.cid })
}

const pageChange = val => router.push({ name: 'contestProblem', params: { id: val } })
const submit = () => router.push({ name: 'contestSubmit', params: router.params })

fetch()
onRouteParamUpdate(fetch)
</script>

<template>
  <div class="conpro-wrap">
    <ul>
      <li v-for="i in totalProblems" :key="i" :class="{ active: i === proIndex }" @click="pageChange(i)">
        {{ i }}
      </li>
    </ul>
    <Problem :problem="problem">
      <template #title>
        {{ $route.params.id }}:  {{ problem.title }}
      </template>
    </Problem>
    <Button shape="circle" icon="md-paper-plane" @click="submit">
      {{ t('oj.submit') }}
    </Button>
  </div>
</template>

<style lang="stylus" scoped>
ul
  margin-left: 10px
  li
    display: inline-block
    vertical-align: middle
    min-width: 32px
    height: 32px
    line-height: 30px
    margin-right: 8px
    text-align: center
    list-style: none
    background-color: #fff
    border: 1px solid #dddee1
    border-radius: 4px
    cursor: pointer
  .active
    color: #fff
    background-color: #e040fb
    border-color: #e040fb
</style>
