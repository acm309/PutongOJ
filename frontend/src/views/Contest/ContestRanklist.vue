<script setup lang="ts">
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import ScrollTop from 'primevue/scrolltop'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { getContestRanklist } from '@/api/contest'
import { useRootStore } from '@/store'
import { useContestStore } from '@/store/modules/contest'
import { useSessionStore } from '@/store/modules/session'
import { formatPercentage, timePretty } from '@/utils/format'
import { buildRanklist, exportSheet } from '@/utils/ranklist'

const { t } = useI18n()
const router = useRouter()
const rootStore = useRootStore()
const contestStore = useContestStore()
const sessionStore = useSessionStore()
const { profile } = storeToRefs(sessionStore)
const { currentTime } = storeToRefs(rootStore)
const { contest, contestId, problems, problemLabels } = storeToRefs(contestStore)

const ranklist = ref([] as ReturnType<typeof buildRanklist>)
const loading = ref(false)

const AUTO_REFRESH_GAP = 10 * 1000 // 10 seconds
const autoRefresh = ref(false)
const lastUpdatedAt = ref<Date | null>(null)
let autoRefreshInterval: ReturnType<typeof setInterval> | null = null

async function getRanklist () {
  loading.value = true
  const resp = await getContestRanklist(contestId.value)
  loading.value = false

  if (!resp.success) {
    return
  }

  ranklist.value = buildRanklist(resp.data, contest.value)
  lastUpdatedAt.value = new Date(currentTime.value)
}

function enableAutoRefresh () {
  autoRefreshInterval = setInterval(async () => {
    await getRanklist()
  }, AUTO_REFRESH_GAP)
  autoRefresh.value = true
}

function clearAutoRefresh () {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval)
  }
  autoRefreshInterval = null
  autoRefresh.value = false
}

function toggleAutoRefresh () {
  if (autoRefresh.value) {
    clearAutoRefresh()
  } else {
    enableAutoRefresh()
  }
}

function formatMinutes (m: number) {
  if (m < 0) {
    return '--:--'
  }
  const hours = String(Math.floor(m / 60)).padStart(2, '0')
  const minutes = String(m % 60).padStart(2, '0')
  return `${hours}:${minutes}`
}

function onViewSolutions (user: string, problem: number) {
  if (contest.value.isJury) {
    router.push({
      name: 'ContestSolutions',
      params: { contestId: contestId.value },
      query: { user, problem },
    })
  } else if (profile.value?.uid === user) {
    router.push({
      name: 'ContestMySubmissions',
      params: { contestId: contestId.value },
      query: { problem },
    })
  }
}

onMounted(getRanklist)
onBeforeUnmount(clearAutoRefresh)
</script>

<template>
  <div class="px-0 py-4">
    <div class="flex gap-4 items-center justify-between px-4">
      <span class="flex gap-3 items-center">
        <Button
          v-if="contest.isJury " icon="pi pi-download"
          @click="() => exportSheet(ranklist, contest)"
        />
        <span v-if="lastUpdatedAt" class="font-mono px-1 text-muted-color text-sm">
          Last updated at:<br>
          {{ timePretty(lastUpdatedAt) }}
        </span>
      </span>

      <span class="flex gap-2 items-center">
        <Button
          v-tooltip.bottom="t('ptoj.auto_refresh')" :icon="autoRefresh ? 'pi pi-stop' : 'pi pi-play'"
          :severity="autoRefresh ? 'primary' : 'secondary'" outlined :disabled="loading" @click="toggleAutoRefresh"
        />
        <Button shape="circle" :loading="loading" icon="pi pi-refresh" @click="getRanklist" />
      </span>
    </div>

    <div class="mt-4 overflow-x-auto">
      <table class="font-(family-name:--font-verdana) min-w-full table-fixed">
        <thead>
          <tr class="h-16">
            <th class="border border-l-0 min-w-20">
              <i class="pi pi-hashtag" />
            </th>
            <th class="border max-w-36">
              User
            </th>
            <th class="border min-w-56">
              Nickname
            </th>
            <th class="border min-w-22">
              Solved
            </th>
            <th class="border min-w-24">
              Penalty
            </th>

            <th
              v-for="problem in problems" :key="problem.problemId" v-tooltip.bottom="problem.title"
              class="border min-w-20"
            >
              <RouterLink :to="{ name: 'contestProblem', params: { contestId, problemId: problem.problemId } }">
                <div class="text-color">
                  {{ problemLabels.get(problem.problemId) }}
                </div>
                <div class="text-muted-color text-sm">
                  {{ problem.solve }}
                </div>
              </RouterLink>
            </th>

            <th class="border border-r-0 min-w-20">
              Dirt
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="ranklist.length === 0">
            <td :colspan="6 + contest.problems.length" class="pb-12 pt-16">
              <span>{{ t('ptoj.empty_content_desc') }}</span>
            </td>
          </tr>

          <tr v-for="(item, index) in ranklist" :key="index" class="h-16 hover:bg-emphasis transition-colors">
            <td class="border border-l-0">
              {{ item.rank }}
            </td>
            <td class="border font-sans overflow-hidden text-ellipsis whitespace-nowrap">
              <RouterLink :to="{ name: 'UserProfile', params: { uid: item.username } }">
                {{ item.username }}
              </RouterLink>
            </td>
            <td class="border break-anywhere font-sans text-balance">
              {{ item.nickname }}
            </td>
            <td class="border">
              {{ item.solvedCount }}
            </td>
            <td class="border">
              {{ item.penalty }}
            </td>

            <template v-for="{ problemId: p } in contest.problems">
              <td v-if="!item.problems[p]" :key="`${p}-1`" class="border" />
              <td
                v-else-if="item.problems[p].isSolved" :key="`${p}-2`" class="border cursor-pointer transition-colors"
                :class="[
                  item.problems[p].isFirstSolved
                    ? 'bg-sky-600/90 hover:bg-sky-700/90'
                    : 'bg-green-500/90 hover:bg-green-600/85',
                ]" @click="() => onViewSolutions(item.username, p)"
              >
                <span class="block font-bold text-white w-full">
                  {{ item.problems[p].failedCount > 0 ? `+${item.problems[p].failedCount}` : '+' }}
                </span>
                <span class="block text-sm text-white w-full">
                  {{ formatMinutes(item.problems[p].solvedAfterMinutes) }}
                </span>
              </td>
              <td v-else :key="`${p}-3`" class="border cursor-pointer" @click="() => onViewSolutions(item.username, p)">
                <span class="flex flex-col leading-tight">
                  <span v-if="item.problems[p].failedCount" class="font-bold text-red-500">
                    -{{ item.problems[p].failedCount }}
                  </span>
                  <span v-if="item.problems[p].pendingCount" class="font-bold text-sky-500">
                    +{{ item.problems[p].pendingCount }}
                  </span>
                </span>
              </td>
            </template>

            <td class="border border-r-0">
              {{ formatPercentage(item.dirt) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <ScrollTop :button-props="{ severity: 'contrast', size: 'large', raised: true }" />
  </div>
</template>

<style scoped>
table th,
table td {
  padding: 8px 12px;
  text-align: center;
  border-color: var(--p-content-border-color);
}
</style>
