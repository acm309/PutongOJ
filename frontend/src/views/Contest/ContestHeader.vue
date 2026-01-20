<script setup lang="ts">
import { storeToRefs } from 'pinia'
import ProgressBar from 'primevue/progressbar'
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import Tabs from 'primevue/tabs'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useRootStore } from '@/store'
import { useContestStore } from '@/store/modules/contest'
import { formatRelativeTime, timeContest, timePretty } from '@/utils/formate'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const rootStore = useRootStore()
const contestStore = useContestStore()

const { contest } = storeToRefs(contestStore)
const { currentTime } = storeToRefs(rootStore)

const contestId = computed(() => Number(route.params.contestId))
const contestLoaded = computed(() => contest.value?.contestId === contestId.value)
const currentView = computed(() => String(route.name || 'contest'))
const startsAt = computed(() => new Date(contest.value.startsAt).getTime())
const endsAt = computed(() => new Date(contest.value.endsAt).getTime())

const timePercentage = computed(() => {
  if (currentTime.value < startsAt.value) return 100
  if (currentTime.value >= endsAt.value) return 100
  return (currentTime.value - startsAt.value) * 100 / (endsAt.value - startsAt.value)
})

const progressBarClass = computed(() => {
  if (currentTime.value < startsAt.value) return 'bg-blue-500'
  if (currentTime.value >= endsAt.value) return 'bg-emerald-500'
  return ''
})

const contestCountdown = computed(() => {
  if (currentTime.value < startsAt.value) {
    const startsIn = Math.ceil((startsAt.value - currentTime.value) / 1000)
    if (startsIn >= 100 * 60 * 60) {
      return t('ptoj.starts_in_relative', { time: formatRelativeTime(startsAt.value, locale.value, false) })
    }
    return t('ptoj.starts_in_countdown', { time: timeContest(startsIn) })
  } else if (currentTime.value < endsAt.value) {
    const endsIn = Math.ceil((endsAt.value - currentTime.value) / 1000)
    if (endsIn >= 100 * 60 * 60) {
      return t('ptoj.ends_in_relative', { time: formatRelativeTime(endsAt.value, locale.value, false) })
    }
    return t('ptoj.ends_in_countdown', { time: timeContest(endsIn) })
  } else {
    return t('ptoj.contest_ended')
  }
})

const firstProblemId = computed(() => {
  if (!contestLoaded.value) return -1
  return contest.value.problems.length > 0 ? contest.value.problems[0].problemId : 1
})
const tabItems = computed(() => {
  const params = { cid: route.params.cid }
  const items = [
    { label: t('oj.overview'), value: 'ContestOverview', params },
    { label: t('ptoj.problem'), value: 'contestProblem', params: { ...params, problemId: route.params.problemId || firstProblemId.value } },
    { label: t('oj.submit'), value: 'contestSubmit', params: { ...params, problemId: route.params.problemId || firstProblemId.value } },
    { label: t('ptoj.my_submissions'), value: 'ContestMySubmissions', params },
    { label: t('ptoj.all_solutions'), value: 'ContestSolutions', params, managerRequire: true },
    { label: t('ptoj.ranklist'), value: 'contestRanklist', params },
    { label: t('ptoj.discussions'), value: 'ContestDiscussions', params },
    { label: t('oj.edit'), value: 'contestEdit', params, managerRequire: true },
  ]
  return items.filter(item => !item.managerRequire || contest.value.isJury)
})

function jumpToCourse () {
  if (!contest.value.course) return
  router.push({ name: 'courseContests', params: { id: contest.value.course.courseId } })
}
</script>

<template>
  <template v-if="contestLoaded">
    <ProgressBar
      :value="timePercentage"
      class="bg-(--p-content-background) border-b border-surface h-6 rounded-none sticky top-0 z-10"
      :pt="{ value: `${progressBarClass} transition-all` }"
    >
      <span class="text-sm whitespace-nowrap">{{ contestCountdown }}</span>
    </ProgressBar>
    <div class="bg-(--p-content-background)">
      <div class="flex justify-between pt-1 px-2">
        <div class="flex flex-col">
          <span>
            {{ timePretty(contest.startsAt) }}
          </span>
          <span class="text-muted-color text-sm">
            {{ t('ptoj.starts_at') }}
          </span>
        </div>
        <div class="flex flex-col text-right">
          <span>
            {{ timePretty(contest.endsAt) }}
          </span>
          <span class="text-muted-color text-sm">
            {{ t('ptoj.ends_at') }}
          </span>
        </div>
      </div>
      <div class="flex justify-center pb-2 pt-6 px-4">
        <div class="flex flex-col gap-2">
          <div
            v-if="contest.course"
            class="cursor-pointer hover:text-primary text-muted-color text-xl transition-colors" @click="jumpToCourse"
          >
            <i class="pi pi-book" />
            {{ contest.course.name }}
          </div>
          <h1 class="font-bold text-3xl text-pretty">
            {{ contest.title }}
          </h1>
        </div>
      </div>
    </div>
    <div class="bg-(--p-content-background) border-b border-surface shadow-lg sticky top-6 z-10">
      <Tabs :value="currentView" class="-mb-px max-w-full mx-auto w-fit">
        <TabList :pt="{ prevButton: 'hidden', nextButton: 'hidden' }">
          <RouterLink v-for="tab in tabItems" :key="tab.label" :to="{ name: tab.value, params: tab.params }">
            <Tab :value="tab.value" class="font-normal text-color">
              <span :class="{ 'text-primary': currentView === tab.value, 'font-semibold': currentView === tab.value }">
                {{ tab.label }}
              </span>
            </Tab>
          </RouterLink>
        </TabList>
      </Tabs>
    </div>
  </template>
</template>
