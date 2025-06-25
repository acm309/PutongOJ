<script setup>
import { storeToRefs } from 'pinia'
import { inject, onBeforeMount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

import { useRootStore } from '@/store'
import { useSessionStore } from '@/store/modules/session'
import { useUserStore } from '@/store/modules/user'
import { onProfileUpdate, onRouteParamUpdate } from '@/util/helper'

import { Spin, Tabs, TabPane } from 'view-ui-plus'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const message = inject('$Message')

const rootStore = useRootStore()
const sessionStore = useSessionStore()
const userStore = useUserStore()

const { privilege } = $(storeToRefs(rootStore))
const { isAdmin, isRoot, profile } = $(storeToRefs(sessionStore))
const { user } = $(storeToRefs(userStore))

let loading = $ref(false)

const currentTab = $computed(() => route.name || 'userProfile')
const isSelf = $computed(() => profile?.uid === user.uid)
const editable = $computed(() => isSelf || (user.privilege === privilege.Root ? isRoot : isAdmin))

const change = (name) => {
  router.push({
    name,
    params: { uid: route.params.uid },
  })
}

const init = async () => {
  loading = true
  await userStore.findOne(route.params)
  rootStore.changeDomTitle({ title: user.uid })
  if (route.name === 'userEdit' && !editable) {
    message.error(t('oj.error_403'))
    change('userProfile')
  }
  loading = false
}

onBeforeMount(init)
onProfileUpdate(init)
onRouteParamUpdate((to, from) => {
  if (to.uid !== from.uid) init()
})
</script>

<template>
  <div :class="{ 'user-wrap': true, 'user-wrap-edit': $route.name === 'userEdit' }">
    <Tabs class="user-tabs" v-if="editable" :model-value="currentTab" @on-click="change">
      <TabPane :label="t('oj.overview')" name="userProfile" />
      <TabPane :label="t('oj.edit')" name="userEdit" />
    </Tabs>
    <router-view class="user-tab" />
    <Spin size="large" fix :show="loading" class="wrap-loading" />
  </div>
</template>

<style lang="stylus">
.user-tabs
  .ivu-tabs-nav-scroll
    padding 0 40px

@media screen and (max-width: 1024px)
  .user-tabs
    .ivu-tabs-nav-scroll
      padding 0 20px
</style>

<style lang="stylus" scoped>
.user-wrap
  width 100%
  max-width 1024px
  padding 0
.user-wrap-edit
  max-width 768px
.user-tabs
  padding-top 24px
  margin-bottom -16px

@media screen and (max-width: 1024px)
  .user-tabs
    padding-top 12px
</style>
