import pickBy from 'lodash.pickby'
import { storeToRefs } from 'pinia'
import { watch } from 'vue'
import { useRoute } from 'vue-router'
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
  watch(() => route.query, callback)
}

export function onRouteParamUpdate (callback) {
  const route = useRoute()
  watch(() => route.params, callback)
}

export function onProfileUpdate (callback) {
  const sessionStore = useSessionStore()
  const { profile } = storeToRefs(sessionStore)
  watch(profile, callback)
}
