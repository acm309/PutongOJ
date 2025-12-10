<script setup>
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { useRootStore } from '@/store'
import { useContestStore } from '@/store/modules/contest'
import { useSessionStore } from '@/store/modules/session'
import { onProfileUpdate, onRouteParamUpdate, purify } from '@/utils/helper'

const contestStore = useContestStore()
const sessionStore = useSessionStore()
const rootStore = useRootStore()
const route = useRoute()

const { contest } = $(storeToRefs(contestStore))
const { findOne } = contestStore
const { changeDomTitle } = rootStore
const { profile } = sessionStore

// eslint-disable-next-line unused-imports/no-unused-vars
let loading = $ref(false)

async function fetch () {
  loading = true
  await findOne(purify({ cid: route.params.cid, uid: profile?.uid }))
  changeDomTitle(contest.name)
  loading = false
}

fetch()
changeDomTitle({ title: `Contest ${route.params.cid}` })
onRouteParamUpdate(() => changeDomTitle({ title: `Contest ${route.params.cid}` }))
onProfileUpdate(fetch)
</script>

<template>
  <div
    class="contest-wrap" :class="{
      'contest-ranklist-wrap': route.name === 'contestRanklist',
      'contest-status-wrap': route.name === 'contestStatus',
    }"
  >
    <RouterView v-if="contest && contest.cid" class="contest-children" />
  </div>
</template>

<style lang="stylus">
.contest-children
  padding 40px 40px

@media screen and (max-width: 1024px)
  .contest-children
    padding 20px 20px
</style>

<style lang="stylus" scoped>
.contest-wrap
  padding 0
  max-width 1024px
.contest-ranklist-wrap
  max-width: 1920px
.contest-status-wrap
  max-width: 1280px
</style>
