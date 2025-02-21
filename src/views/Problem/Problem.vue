<script setup>
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useSessionStore } from '@/store/modules/session'

import { Tabs, TabPane } from 'view-ui-plus'

const { t } = useI18n()
const sessionStore = useSessionStore()
const { isAdmin, isLogined } = $(storeToRefs(sessionStore))
const route = useRoute()
const router = useRouter()
const display = $computed(() => route.name)

function handleClick(name) {
  if (name !== display)
    router.push({ name, params: { pid: route.params.pid } })
}
</script>

<template>
  <div :class="{ 'problem-wrap': true, 'problem-wrap-edit': display === 'problemEdit' }">
    <Tabs class="problem-tabs" :model-value="display" @on-click="handleClick">
      <TabPane :label="t('oj.description')" name="problemInfo" />
      <TabPane :label="t('oj.submit')" name="problemSubmit" />
      <TabPane :label="t('oj.my_submissions')" name="mySubmission" v-if="isLogined" />
      <TabPane :label="t('oj.statistics')" name="problemStatistics" />
      <TabPane :label="t('oj.edit')" name="problemEdit" v-if="isAdmin" />
      <TabPane :label="t('oj.test_data')" name="testcase" v-if="isAdmin" />
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
.problem-wrap-edit
  max-width 1280px !important
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
