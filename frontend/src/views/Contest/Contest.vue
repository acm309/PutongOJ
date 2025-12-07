<script setup>
import { storeToRefs } from 'pinia'
import { Card, Icon, Poptip, Progress, Space, Spin, TabPane, Tabs } from 'view-ui-plus'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useRootStore } from '@/store'
import { useContestStore } from '@/store/modules/contest'
import { useSessionStore } from '@/store/modules/session'
import { timeContest, timePretty } from '@/utils/formate'
import { onProfileUpdate, onRouteParamUpdate, purify } from '@/utils/helper'

const { t } = useI18n()
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

let loading = $ref(false)

const isManageable = $computed(() => {
  if (contest.cid !== Number(route.params.cid)) {
    return false
  }
  if (isAdmin || contest.course?.role.manageContest) {
    return true
  }
  return false
})
const timePercentage = $computed(() => {
  if (currentTime < contest.start) return 0
  if (currentTime >= contest.end) return 100
  const percentage = (currentTime - contest.start) * 100 / (contest.end - contest.start)
  return Math.floor(percentage * 10) / 10
})
const progressStatus = $computed(() => {
  if (timePercentage === 100) return 'success'
  if (timePercentage > 0) return 'active'
  return 'normal'
})
const contestCountdown = $computed(() => {
  if (currentTime < contest.start) {
    const startsIn = Math.ceil((contest.start - currentTime) / 1000)
    if (startsIn >= 1000 * 60 * 60) {
      return t('oj.contest_start_long')
    }
    return timeContest(startsIn)
  }
  if (currentTime < contest.end) {
    const endsIn = Math.ceil((contest.end - currentTime) / 1000)
    if (endsIn >= 1000 * 60 * 60) {
      return t('oj.contest_last_long')
    }
    return timeContest(endsIn)
  }
  return t('oj.contest_ended')
})

function handleClick (name) {
  if (name === 'contestProblem' || name === 'contestSubmit')
    router.push({ name, params: { cid: route.params.cid, id: route.params.id || 1 } })
  else
    router.push({ name, params: { cid: route.params.cid } })
}

function jumpToCourse () {
  if (!contest.course) {
    return
  }
  router.push({ name: 'courseContests', params: { id: contest.course.courseId } })
}

async function fetch () {
  loading = true
  await findOne(purify({ cid: route.params.cid, uid: profile?.uid }))
  changeDomTitle(contest.name)
  loading = false
}

fetch()
changeDomTitle({ title: `Contest ${route.params.cid}` })
onRouteParamUpdate(() => changeDomTitle({ title: `Contest ${route.params.cid}` }))
onProfileUpdate(fetch)
</script>

<template>
  <div
    class="contest-wrap" :class="{
      'contest-ranklist-wrap': $route.name === 'contestRanklist',
      'contest-status-wrap': $route.name === 'contestStatus',
    }"
  >
    <div v-if="contest.course" class="contest-back-course">
      <Space class="contest-back-content" @click="jumpToCourse">
        <Icon class="contest-back-icon" type="md-arrow-back" />
        <span>
          {{ contest.course.name }}
        </span>
      </Space>
    </div>
    <Poptip class="contest-poptip" trigger="hover" placement="bottom">
      <Card class="contest-card" dis-hover>
        <div class="contest-info">
          <span class="contest-begin-time">
            <span class="tag">{{ t('oj.begin') }}</span>
            <span class="time">{{ timePretty(contest.start) }}</span>
          </span>
          <span v-if="currentTime < contest.start" class="contest-status ready">{{ t('oj.ready') }}</span>
          <span v-else-if="currentTime < contest.end" class="contest-status running">{{ t('oj.running') }}</span>
          <span v-else class="contest-status ended">{{ t('oj.ended') }}</span>
          <span class="contest-end-time">
            <span class="tag">{{ t('oj.end') }}</span>
            <span class="time">{{ timePretty(contest.end) }}</span>
          </span>
        </div>
        <Progress
          class="contest-progress" :stroke-width="19" :status="progressStatus" :percent="timePercentage"
          text-inside
        />
      </Card>
      <template #content>
        <span class="contest-countdown">{{ contestCountdown }}</span>
      </template>
    </Poptip>
    <Tabs class="contest-tabs" :model-value="display" @on-click="handleClick">
      <TabPane :label="t('oj.overview')" name="contestOverview" />
      <TabPane :label="t('oj.problem')" name="contestProblem" />
      <TabPane :label="t('oj.submit')" name="contestSubmit" />
      <TabPane :label="t('ptoj.my_submissions')" name="ContestMySubmissions" />
      <TabPane v-if="isManageable" :label="t('ptoj.all_solutions')" name="ContestSolutions" />
      <TabPane :label="t('ptoj.discussions')" name="ContestDiscussions" />
      <TabPane :label="t('oj.ranklist')" name="contestRanklist" />
      <TabPane v-if="isManageable" :label="t('oj.edit')" name="contestEdit" />
    </Tabs>
    <!-- 此处 if：为了确保之后的 children 能拿到 contest -->
    <RouterView v-if="contest && contest.cid" class="contest-children" />
    <Spin size="large" fix :show="loading" class="wrap-loading" />
  </div>
</template>

<style lang="stylus">
.contest-poptip
  width 100%
  .ivu-poptip-rel
    display block

.contest-progress
  .ivu-progress-inner-text
    display block

.contest-tabs
  .ivu-tabs-nav-scroll
    padding 0 40px
  .ivu-tabs-nav-scrollable
    .ivu-tabs-nav-scroll
      padding 0 !important

.contest-children
  padding 0 40px 40px

@media screen and (max-width: 1024px)
  .contest-tabs
    .ivu-tabs-nav-scroll
      padding 0 20px
  .contest-children
    padding 0 20px 20px
</style>

<style lang="stylus" scoped>
.contest-countdown
  display block
  width 100%
  text-align center
  font-family var(--font-verdana)

.contest-back-course
  padding 15px 40px
  border-bottom 1px solid #dcdee2
  font-size 16px
  transition padding 0.2s ease
  .contest-back-content
    cursor pointer
    &:hover
      color var(--oj-primary-color)
    transition color 0.2s ease
  .contest-back-icon
    font-size 20px

.contest-card
  margin 40px 40px 24px
  .contest-info
    width 100%
    padding 8px 40px 20px
    display flex
    justify-content space-between
    align-items center
    font-size 16px
    font-family var(--font-verdana)
    .contest-begin-time
      text-align left
    .contest-end-time
      text-align right
    .contest-status
      padding 0 40px
      font-size 18px
      font-weight bold
      &.ready
        color #2d8cf0
      &.running
        color var(--oj-primary-color)
      &.ended
        color #19be6b
    .contest-begin-time, .contest-end-time
      .tag
        font-size 12px
      .time
        display block

@media screen and (max-width: 1024px)
  .contest-back-course
    padding 10px 20px
  .contest-card
    margin 20px 20px 12px

@media screen and (max-width: 768px)
  .contest-card
    .contest-info
      padding 0 4px 8px
      font-size 14px
      .contest-status
        padding 0 20px

.contest-wrap
  padding 0
  max-width 1024px
.contest-ranklist-wrap
  max-width: 1920px
.contest-status-wrap
  max-width: 1280px
</style>
