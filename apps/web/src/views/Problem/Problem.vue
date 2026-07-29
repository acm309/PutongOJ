<script setup lang="ts">
import type { RouteLocationNormalized } from 'vue-router'
import { storeToRefs } from 'pinia'
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import Tabs from 'primevue/tabs'
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useRootStore } from '@/store'
import { useProblemStore } from '@/store/modules/problem'
import { useSessionStore } from '@/store/modules/session'

const { t } = useI18n()
const rootStore = useRootStore()
const sessionStore = useSessionStore()
const problemStore = useProblemStore()

const { findOne } = problemStore
const { changeDomTitle } = rootStore

const { isAdmin, isLogined } = storeToRefs(sessionStore)
const { problem } = storeToRefs(problemStore)
const route = useRoute()
const display = computed(() => route.name as string || '')
const isLoaded = computed(() => problem.value?.pid === Number(route.params.pid))
const isEditable = computed(() => {
  if (!isLoaded.value) {
    return false
  }
  if (isAdmin.value || problem.value?.isOwner) {
    return true
  }
  return false
})

const tabItems = computed(() => {
  const params = { pid: route.params.pid }
  const items: Array<{ label: string, value: string, params?: RouteLocationNormalized['params'], route?: string }> = [
    { label: t('oj.description'), value: 'problemInfo', params },
    { label: t('oj.submit'), value: 'problemSubmit', params },
  ]
  if (isLogined.value) {
    items.push({ label: t('oj.my_submissions'), value: 'MySubmissions', route: 'MySubmissions' })
  }
  items.push(
    { label: t('oj.statistics'), value: 'problemStatistics', params },
    { label: t('ptoj.discussions'), value: 'ProblemDiscussions', params },
    { label: t('ptoj.all_solutions'), value: 'ProblemSolutions', params },
  )
  if (isEditable.value) {
    items.push(
      { label: t('oj.edit'), value: 'problemEdit', params },
      { label: t('oj.test_data'), value: 'testcase', params },
    )
  }
  return items
})

async function init () {
  const pid = Number.parseInt(route.params.pid as string)
  await findOne({ pid })
  if (problem.value?.title) {
    changeDomTitle({ title: problem.value.title })
  }
}

onMounted(init)
</script>

<template>
  <div class="problem-wrap">
    <div class="border-b border-surface">
      <Tabs :value="display" class="-mb-px max-w-full mx-auto w-fit">
        <TabList :pt="{ prevButton: 'hidden', nextButton: 'hidden' }">
          <RouterLink
            v-for="tab in tabItems" :key="tab.label"
            :to="{ name: tab.value, params: tab.params, query: tab.value === 'MySubmissions' ? { problem: route.params.pid } : undefined }"
          >
            <Tab :value="tab.value" class="font-normal text-color">
              <span :class="{ 'text-primary': display === tab.value, 'font-semibold': display === tab.value }">
                {{ tab.label }}
              </span>
            </Tab>
          </RouterLink>
        </TabList>
      </Tabs>
    </div>
    <RouterView v-if="isLoaded" class="problem-children" />
  </div>
</template>

<style lang="stylus" scoped>
.problem-wrap
  padding 0
  max-width 1024px
.problem-children
  padding 40px 40px
  position relative

@media screen and (max-width: 1024px)
  .problem-children
    padding 20px 20px
</style>
