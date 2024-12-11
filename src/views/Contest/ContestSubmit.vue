<script setup>
import { storeToRefs } from 'pinia'
import { inject, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import OJSubmit from '@/components/Submit'
import { useSolutionStore } from '@/store/modules/solution'
import { useContestStore } from '@/store/modules/contest'

const { t } = useI18n()
const contestStore = useContestStore()
const solutionStore = useSolutionStore()
const route = useRoute()
const router = useRouter()
const $Message = inject('$Message')

const { problems, overview, totalProblems } = storeToRefs(contestStore)
const { solution } = storeToRefs(solutionStore)
const { clearCode, create } = solutionStore

const currentProblemId = computed(() => Number(route.params.id))
const currentContestId = computed(() => route.params.cid)
const currentTitle = computed(() => overview.value[currentProblemId.value - 1]?.title)

const pageChange = val => {
  if (overview[val - 1].invalid) return
  router.push({ name: 'contestSubmit', params: { cid: contest.cid, id: val } })
}
const reset = clearCode

async function submit() {
  await create({
    ...solution.value,
    pid: problems.value[currentProblemId.value - 1],
    mid: currentContestId.value,
  })
  router.push({
    name: 'contestStatus',
    params: route.params,
  })
  $Message.info(`submit id:${currentProblemId.value} success!`)
}
</script>

<template>
  <div>
    <ul>
      <li v-for="i in totalProblems" :key="i" @click="pageChange(i)"
        :class="{ active: i === currentProblemId, invalid: overview[i - 1].invalid }">
        {{ i }}
      </li>
    </ul>
    <h1>{{ currentProblemId }}: {{ currentTitle }}</h1>
    <OJSubmit />
    <Button type="primary" @click="submit">
      {{ t('oj.submit') }}
    </Button>
    <Button style="margin-left: 8px" @click="reset">
      {{ t('oj.reset') }}
    </Button>
  </div>
</template>

<style lang="stylus" scoped>
h1
  color: #9799ca
  margin-top: 10px
  margin-bottom: 20px
  text-align: center
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
  .invalid
    cursor: not-allowed
    color: #aaa
</style>
