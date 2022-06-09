<script setup>
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useSessionStore } from '@/store/modules/session'

const { t } = useI18n()
const sessionStore = useSessionStore()
const { isAdmin, isLogined } = $(storeToRefs(sessionStore))
const route = useRoute()
const router = useRouter()
const active = $computed(() => route.name)
const change = (name) => {
  if (name !== active) {
    router.push({ name, params: { pid: route.params.pid } })
  }
}
</script>

<template>
  <div>
    <Tabs :model-value="active" @on-click="change">
      <TabPane :label="t('oj.description')" name="problemInfo" />
      <TabPane :label="t('oj.submit')" name="problemSubmit" />
      <TabPane v-if="isLogined" :label="t('oj.my_submissions')" name="mySubmission" />
      <TabPane :label="t('oj.statistics')" name="problemStatistics" />
      <!-- <TabPane label="Discuss" name="Discuss"></TabPane> -->
      <TabPane v-if="isAdmin" :label="t('oj.edit')" name="problemEdit" />
      <TabPane v-if="isAdmin" :label="t('oj.test_data')" name="testcase" />
    </Tabs>
    <router-view />
  </div>
</template>
