<script setup>
import { storeToRefs } from 'pinia'
import { inject, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import OJSubmit from '@/components/Submit'
import { useSolutionStore } from '@/store/modules/solution'
import { useContestStore } from '@/store/modules/contest'

import { Space, Button } from 'view-ui-plus'

const { t } = useI18n()
const contestStore = useContestStore()
const solutionStore = useSolutionStore()
const route = useRoute()
const router = useRouter()
const $Message = inject('$Message')

const { problems, overview, contest, totalProblems } = storeToRefs(contestStore)
const { solution } = storeToRefs(solutionStore)
const { clearCode, create } = solutionStore

const currentProblemId = computed(() => Number(route.params.id))
const currentContestId = computed(() => route.params.cid)
const currentTitle = computed(() => overview.value[currentProblemId.value - 1]?.title)

const pageChange = val => {
  if (overview.value[val - 1].invalid) return
  router.push({ name: 'contestSubmit', params: { cid: contest.cid, id: val } })
}
const reset = clearCode

async function submit() {
  let response = await create({
    ...solution.value,
    pid: problems.value[currentProblemId.value - 1],
    mid: currentContestId.value,
  })
  if (response.isAxiosError) return
  router.push({
    name: 'contestStatus',
    params: route.params,
  })
  $Message.info(`submit id:${currentProblemId.value} success!`)
}
</script>

<template>
  <div class="contest-children">
    <Space class="problem-nav" wrap :size="[8, 8]">
      <Button class="problem-nav-item" v-for="i in totalProblems" :key="i" @click="pageChange(i)"
        :type="i === currentProblemId ? 'primary' : 'default'" :disabled="overview[i - 1].invalid">
        {{ i }}
      </Button>
    </Space>
    <div class="problem-content">
      <h1>{{ currentProblemId }}: {{ currentTitle }}</h1>
      <OJSubmit />
      <Button type="primary" @click="submit">
        {{ t('oj.submit') }}
      </Button>
      <Button style="margin-left: 8px" @click="reset">
        {{ t('oj.reset') }}
      </Button>
    </div>
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

h1
  color: #757575
  margin-top: 10px
  margin-bottom: 20px
  text-align: center
</style>
