import pickBy from 'lodash.pickby'
import { storeToRefs } from 'pinia'
import { watch } from 'vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'
import { useStorage } from '@vueuse/core'
import { useSessionStore } from '@/store/modules/session'
export function purify (obj: object) {
  return pickBy(obj, x => x != null && x !== '')
}

// TODO: 后期这里应该会改 URL
export function testcaseUrl (pid: number, uuid: string, type = 'in') {
  return `/api/testcase/${pid}/${uuid}?type=${type}`
}

export function onRouteQueryUpdate (callback: (...args: any[]) => void) {
  const route = useRoute()
  const unwatch = watch(() => route.query, callback)
  // Unwatch when route is leaving.
  // E.g.: /status?page=4 -> /ranklist
  // if not unwatch, a call to /api/status?page=4 will be triggered
  // when navigating to /ranklist.
  onBeforeRouteLeave(unwatch)
}

export function onRouteParamUpdate (callback: (...args: any[]) => void) {
  const route = useRoute()
  const unwatch = watch(() => route.params, callback)
  onBeforeRouteLeave(unwatch)
}

export function onRouteNameUpdate (callback: (...args: any[]) => void) {
  const route = useRoute()
  const unwatch = watch(() => route.name, callback)
  onBeforeRouteLeave(unwatch)
}

export function onProfileUpdate (callback: (...args: any[]) => void) {
  const sessionStore = useSessionStore()
  const { profile } = storeToRefs(sessionStore)
  const unwatch = watch(profile, callback)
  onBeforeRouteLeave(unwatch)
}

export function useHumanLanguage () {
  return useStorage('oj_human_language', 'zh-CN')
}
