<script setup>
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useSessionStore } from '@/store/modules/session'

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
      <TabPane label="Description" name="problemInfo" />
      <TabPane label="Submit" name="problemSubmit" />
      <TabPane v-if="isLogined" label="My Submissions" name="mySubmission" />
      <TabPane label="Statistics" name="problemStatistics" />
      <!-- <TabPane label="Discuss" name="Discuss"></TabPane> -->
      <TabPane v-if="isAdmin" label="Edit" name="problemEdit" />
      <TabPane v-if="isAdmin" label="Test Data" name="testcase" />
    </Tabs>
    <router-view />
  </div>
</template>
