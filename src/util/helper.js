import pickBy from 'lodash.pickby'
import { storeToRefs } from 'pinia'
import { watch } from 'vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'
import { useStorage } from '@vueuse/core'
import { useSessionStore } from '@/store/modules/session'
export function purify (obj) {
  return pickBy(obj, x => x != null && x !== '')
}

// TODO: 后期这里应该会改 URL
export function testcaseUrl (pid, uuid, type = 'in') {
  return `/api/testcase/${pid}/${uuid}?type=${type}`
}

export function onRouteQueryUpdate (callback) {
  const route = useRoute()
  const unwatch = watch(() => route.query, callback)
  // Unwatch when route is leaving.
  // E.g.: /status?page=4 -> /ranklist
  // if not unwatch, a call to /api/status?page=4 will be triggered
  // when navigating to /ranklist.
  onBeforeRouteLeave(unwatch)
}

export function onRouteParamUpdate (callback) {
  const route = useRoute()
  const unwatch = watch(() => route.params, callback)
  onBeforeRouteLeave(unwatch)
}

export function onRouteNameUpdate (callback) {
  const route = useRoute()
  const unwatch = watch(() => route.name, callback)
  onBeforeRouteLeave(unwatch)
}

export function onProfileUpdate (callback) {
  const sessionStore = useSessionStore()
  const { profile } = storeToRefs(sessionStore)
  const unwatch = watch(profile, callback)
  onBeforeRouteLeave(unwatch)
}

export function useHumanLanguage () {
  return useStorage('oj_human_language', 'zh-CN')
}
