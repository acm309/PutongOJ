<script setup>
import { storeToRefs } from 'pinia'
import { TabPane, Tabs } from 'view-ui-plus'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useProblemStore } from '@/store/modules/problem'
import { useSessionStore } from '@/store/modules/session'

const { t } = useI18n()
const sessionStore = useSessionStore()
const problemStore = useProblemStore()

const { isAdmin, isLogined } = storeToRefs(sessionStore)
const { problem } = storeToRefs(problemStore)
const route = useRoute()
const router = useRouter()
const display = $computed(() => route.name)
const isEditable = computed(() => {
  if (problem.value?.pid !== Number(route.params.pid)) {
    return false
  }
  if (isAdmin.value || problem.value?.isOwner) {
    return true
  }
  return false
})

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
</script>

<template>
  <div class="problem-wrap">
    <Tabs class="problem-tabs" :model-value="display" @on-click="handleClick">
      <TabPane :label="t('oj.description')" name="problemInfo" />
      <TabPane :label="t('oj.submit')" name="problemSubmit" />
      <TabPane v-if="isLogined" :label="t('oj.my_submissions')" name="MySubmissions" />
      <TabPane :label="t('oj.statistics')" name="problemStatistics" />
      <TabPane v-if="isEditable" :label="t('oj.edit')" name="problemEdit" />
      <TabPane v-if="isEditable" :label="t('oj.test_data')" name="testcase" />
    </Tabs>
    <router-view class="problem-children" />
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
