<script setup>
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useSessionStore } from '@/store/modules/session'

const route = useRoute()
const router = useRouter()

const sessionStore = useSessionStore()
const { canRemove } = $(storeToRefs(sessionStore))

const active = $computed(() => route.name)
const change = name => router.push({ name })
</script>

<template>
  <div class="usermanage">
    <Tabs :model-value="active" @on-click="change">
      <TabPane label="UserEdit" name="userEdit" />
      <TabPane label="GroupEdit" name="groupEdit" />
      <TabPane v-if="canRemove" label="AdminEdit" name="adminEdit" />
      <TabPane label="TagEdit" name="tagEdit" />
    </Tabs>
    <router-view />
  </div>
</template>

<style lang="stylus">
.usermanage
  h1
    margin-bottom: 20px
  .ivu-row-flex
    margin-bottom: 10px
  .label
    line-height: 32px
  .submit
    margin-bottom: 20px
</style>
