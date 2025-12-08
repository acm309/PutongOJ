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
import { useSessionStore } from '@/store/modules/session'
import { formatRelativeTime, timeContest, timePretty } from '@/utils/formate'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const rootStore = useRootStore()
const contestStore = useContestStore()
const sessionStore = useSessionStore()

const { contest } = storeToRefs(contestStore)
const { isAdmin } = storeToRefs(sessionStore)
const { currentTime } = storeToRefs(rootStore)

const currentView = computed(() => String(route.name || 'contest'))

const isManageable = computed(() => {
  if (contest.value.cid !== Number(route.params.cid)) return false
  if (isAdmin.value || contest.value.course?.role.manageContest) return true
  return false
})

const timePercentage = computed(() => {
  if (currentTime.value < contest.value.start) return 100
  if (currentTime.value >= contest.value.end) return 100
  return (currentTime.value - contest.value.start) * 100 / (contest.value.end - contest.value.start)
})

const progressBarClass = computed(() => {
  if (currentTime.value < contest.value.start) return 'bg-blue-500'
  if (currentTime.value >= contest.value.end) return 'bg-emerald-500'
  return ''
})

const contestCountdown = computed(() => {
  if (currentTime.value < contest.value.start) {
    const startsIn = Math.ceil((contest.value.start - currentTime.value) / 1000)
    if (startsIn >= 100 * 60 * 60) {
      return formatRelativeTime(contest.value.start, locale.value, false)
    }
    return timeContest(startsIn)
  } else if (currentTime.value < contest.value.end) {
    const endsIn = Math.ceil((contest.value.end - currentTime.value) / 1000)
    if (endsIn >= 100 * 60 * 60) {
      return formatRelativeTime(contest.value.end, locale.value, false)
    }
    return timeContest(endsIn)
  } else {
    return t('ptoj.contest_ended')
  }
})

const tabItems = computed(() => {
  const params = { cid: route.params.cid }
  const items = [
    { label: t('oj.overview'), value: 'contestOverview', params },
    { label: t('ptoj.problem'), value: 'contestProblem', params: { ...params, id: route.params.id || 1 } },
    { label: t('oj.submit'), value: 'contestSubmit', params: { ...params, id: route.params.id || 1 } },
    { label: t('ptoj.my_submissions'), value: 'ContestMySubmissions', params },
    { label: t('ptoj.all_solutions'), value: 'ContestSolutions', params, managerRequire: true },
    { label: t('ptoj.ranklist'), value: 'contestRanklist', params },
    { label: t('ptoj.discussions'), value: 'ContestDiscussions', params },
    { label: t('oj.edit'), value: 'contestEdit', params, managerRequire: true },
  ]
  return items.filter(item => !item.managerRequire || isManageable.value)
})

function jumpToCourse () {
  if (!contest.value.course) return
  router.push({ name: 'courseContests', params: { id: contest.value.course.courseId } })
}
</script>

<template>
  <ProgressBar
    :value="timePercentage"
    class="bg-(--p-content-background) border-b border-surface h-6 rounded-none sticky top-0 z-10"
    :pt="{ value: `${progressBarClass} transition-all` }"
  >
    <span class="text-sm">{{ contestCountdown }}</span>
  </ProgressBar>
  <div class="bg-(--p-content-background)">
    <div class="flex justify-between pt-1 px-2">
      <div class="flex flex-col">
        <span>
          {{ timePretty(contest.start) }}
        </span>
        <span class="text-muted-color text-sm">
          {{ t('ptoj.starts_at') }}
        </span>
      </div>
      <div class="flex flex-col text-right">
        <span>
          {{ timePretty(contest.end) }}
        </span>
        <span class="text-muted-color text-sm">
          {{ t('ptoj.ends_at') }}
        </span>
      </div>
    </div>
    <div class="flex justify-center pb-2 pt-6 px-4">
      <div class="flex flex-col gap-2">
        <div v-if="contest.course" class="cursor-pointer hover:text-primary text-muted-color text-xl transition-colors" @click="jumpToCourse">
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
