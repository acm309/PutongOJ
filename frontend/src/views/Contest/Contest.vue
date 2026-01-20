<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useRootStore } from '@/store'
import { useContestStore } from '@/store/modules/contest'
import { useMessage } from '@/utils/message'

const { t } = useI18n()
const route = useRoute()
const message = useMessage()

const rootStore = useRootStore()
const contestStore = useContestStore()
const { contest } = storeToRefs(contestStore)

const contestId = computed(() => Number(route.params.contestId))
const contestLoaded = computed(() => contest.value?.contestId === contestId.value)

async function fetch () {
  const resp = await contestStore.loadContest(contestId.value)
  if (!resp.success) {
    message.error(t('ptoj.failed_fetch_contest'), resp.message)
    return
  }
  const title = `${resp.data.title} - Contest ${resp.data.contestId}`
  rootStore.changeDomTitle({ title })
}

onMounted(fetch)
</script>

<template>
  <div v-if="!contestLoaded" class="max-w-6xl p-0">
    <div class="flex font-semibold gap-4 items-center pt-6 px-6">
      <i class="pi pi-trophy text-2xl" />
      <h1 class="text-xl">
        {{ t('ptoj.contest') }}
      </h1>
    </div>
    <div class="flex gap-4 items-center justify-center px-6 py-24">
      <i class="pi pi-spin pi-spinner text-2xl" />
      <span>{{ t('ptoj.loading') }}</span>
    </div>
  </div>
  <RouterView
    v-else class="contest-wrap" :class="{
      'contest-ranklist-wrap': route.name === 'contestRanklist',
      'contest-status-wrap': route.name === 'contestStatus',
    }"
  />
</template>

<style lang="stylus">
@media screen and (max-width: 1024px)
  .contest-children
    padding 20px 20px
</style>

<style lang="stylus" scoped>
.contest-wrap
  padding 40px 40px
  max-width 1024px
.contest-ranklist-wrap
  max-width: 1920px
.contest-status-wrap
  max-width: 1280px
</style>
