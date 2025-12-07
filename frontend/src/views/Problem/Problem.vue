<script setup>
import { storeToRefs } from 'pinia'
import { TabPane, Tabs } from 'view-ui-plus'
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
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
const router = useRouter()
const display = $computed(() => route.name)
const isLoaded = $computed(() => problem.value?.pid === Number(route.params.pid))
const isEditable = computed(() => {
  if (!isLoaded) {
    return false
  }
  if (isAdmin.value || problem.value?.isOwner) {
    return true
  }
  return false
})

let loading = $ref(false)

function handleClick (name) {
  if (name === display) {
    return
  }
  if (name === 'MySubmissions') {
    router.push({ name, query: { problem: route.params.pid } })
    return
  }
  router.push({ name, params: { pid: route.params.pid } })
}

async function init () {
  loading = true
  await findOne(route.params)
  changeDomTitle({ title: problem.title })
  loading = false
}

onMounted(init)
</script>

<template>
  <div class="problem-wrap">
    <Tabs class="problem-tabs" :model-value="display" @on-click="handleClick">
      <TabPane :label="t('oj.description')" name="problemInfo" />
      <TabPane :label="t('oj.submit')" name="problemSubmit" />
      <TabPane v-if="isLogined" :label="t('oj.my_submissions')" name="MySubmissions" />
      <TabPane :label="t('oj.statistics')" name="problemStatistics" />
      <TabPane :label="t('ptoj.discussions')" name="ProblemDiscussions" />
      <TabPane :label="t('ptoj.all_solutions')" name="ProblemSolutions" />
      <TabPane v-if="isEditable" :label="t('oj.edit')" name="problemEdit" />
      <TabPane v-if="isEditable" :label="t('oj.test_data')" name="testcase" />
    </Tabs>
    <RouterView v-if="isLoaded" class="problem-children" />
    <Spin size="large" fix :show="loading" class="wrap-loading" />
  </div>
</template>

<style lang="stylus">
.problem-tabs
  .ivu-tabs-nav-scroll
    padding 0 40px
  .ivu-tabs-nav-scrollable
    .ivu-tabs-nav-scroll
      padding 0 !important

@media screen and (max-width: 1024px)
  .problem-tabs
    .ivu-tabs-nav-scroll
      padding 0 20px
</style>

<style lang="stylus" scoped>
.problem-wrap
  padding 0
  max-width 1024px
.problem-tabs
  padding-top 24px
  margin-bottom 24px
.problem-children
  padding 0 40px 40px
  position relative

@media screen and (max-width: 1024px)
  .problem-children
    padding 0 20px 20px
  .problem-tabs
    padding-top 12px
    margin-bottom 4px
</style>
