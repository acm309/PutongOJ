<script setup>
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useSessionStore } from '@/store/modules/session'
import { useRootStore } from '@/store'
import { useContestStore } from '@/store/modules/contest'
import { timePretty } from '@/util/formate'
import { onProfileUpdate, onRouteParamUpdate, purify } from '@/util/helper'

const contestStore = useContestStore()
const sessionStore = useSessionStore()
const rootStore = useRootStore()
const route = useRoute()
const router = useRouter()

const { contest } = $(storeToRefs(contestStore))
const { isAdmin } = $(storeToRefs(sessionStore))
const { currentTime } = $(storeToRefs(rootStore))
const { findOne } = contestStore
const { changeDomTitle } = rootStore
const { profile } = sessionStore

const display = $computed(() => route.name || 'contest')

const timePercentage = $computed(() => {
  if (currentTime < contest.start) {
    return 0
  } else if (currentTime > contest.end) {
    return 100
  } else {
    return +((currentTime - contest.start) * 100
        / (contest.end - contest.start)).toFixed(1)
  }
})

function handleClick (name) {
  if (name === 'contestProblem' || name === 'contestSubmit') {
    router.push({ name, params: { cid: route.params.cid, id: route.params.id || 1 } })
  } else {
    router.push({ name, params: { cid: route.params.cid } })
  }
}

async function fetch () {
  await findOne(purify({ cid: route.params.cid, uid: profile?.uid }))
  changeDomTitle(contest.name)
}

fetch()
changeDomTitle({ title: `Contest ${route.params.cid}` })
onRouteParamUpdate(() => changeDomTitle({ title: `Contest ${route.params.cid}` }))
onProfileUpdate(fetch)
</script>

<template>
  <div class="conin-wrap">
    <Card class="card">
      <Row type="flex" justify="center">
        <Col :span="6">
          Begin: {{ timePretty(contest.start) }}
        </Col>
        <Col v-if="currentTime < contest.start" :span="12">
          Ready
        </Col>
        <Col v-if="currentTime > contest.start && currentTime < contest.end" :span="12">
          Running
        </Col>
        <Col v-if="currentTime > contest.end" :span="12">
          Ended
        </Col>
        <Col :span="6">
          End: {{ timePretty(contest.end) }}
        </Col>
      </Row>
      <Progress :stroke-width="18" :percent="timePercentage" />
    </Card>
    <Tabs :model-value="display" @on-click="handleClick">
      <TabPane label="Overview" name="contestOverview" />
      <TabPane label="Problem" name="contestProblem" />
      <TabPane label="Submit" name="contestSubmit" />
      <TabPane label="Status" name="contestStatus" />
      <TabPane label="Ranklist" name="contestRanklist" />
      <TabPane v-if="isAdmin" label="Edit" name="contestEdit" />
    </Tabs>
    <router-view v-if="contest && contest.cid" />
    <!-- 为了确保之后的 children 能拿到 contest -->
  </div>
</template>

<style lang="stylus">
.conin-wrap
  margin-bottom: 20px
  .card
    margin-bottom: 20px
  .ivu-col
    text-align: center
    margin-bottom: 20px
    font-size: 16px
  .ivu-progress-bg
    background-color: #e040fb
  .ivu-progress-text
    color: #e040fb
</style>
