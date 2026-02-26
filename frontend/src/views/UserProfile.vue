<script setup lang="ts">
import type { UserProfileQueryResult } from '@putongoj/shared'
import { UserPrivilege } from '@putongoj/shared'
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import Fieldset from 'primevue/fieldset'
import Tag from 'primevue/tag'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { getUser } from '@/api/user'
import CodeforcesProfile from '@/components/CodeforcesProfile.vue'
import { useRootStore } from '@/store'
import { useSessionStore } from '@/store/modules/session'
import { getPrivilegeLabel, getPrivilegeSeverity, timePretty } from '@/utils/format'
import { onRouteParamUpdate } from '@/utils/helper'
import { useMessage } from '@/utils/message'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const message = useMessage()
const sessionStore = useSessionStore()
const { changeDomTitle } = useRootStore()
const { isAdmin, profile } = storeToRefs(sessionStore)

const uid = computed(() => route.params.uid as string)
const user = ref<UserProfileQueryResult | null>(null)
const loading = ref(false)

const nickname = computed(() => {
  if (!user.value) return ''
  return user.value.nick || user.value.uid
})
const username = computed(() => {
  if (!user.value || !user.value.nick || user.value.nick === user.value.uid) return ''
  return user.value.uid
})
const isSelf = computed(() => {
  if (!profile.value || !user.value) return false
  return profile.value.uid === user.value.uid
})

async function fetch () {
  loading.value = true
  const resp = await getUser(uid.value)
  loading.value = false
  if (!resp.success) {
    message.error(t('ptoj.failed_load_user'), resp.message)
    return
  }

  user.value = resp.data
  changeDomTitle({ title: `${user.value.uid} - User Profile` })
}

function gotoUserManagement () {
  if (!isAdmin.value || !user.value) return
  router.push({ name: 'UserManagementDetail', params: { uid: user.value.uid } })
}

function gotoAccountSettings () {
  if (!profile.value || !user.value) return
  if (profile.value.uid !== user.value.uid) return
  router.push({ name: 'AccountSettings' })
}

onMounted(fetch)
onRouteParamUpdate(fetch)
</script>

<template>
  <div class="max-w-6xl p-0">
    <template v-if="loading || !user">
      <div class="flex font-semibold gap-4 items-center pt-6 px-6">
        <i class="pi pi-user text-2xl" />
        <h1 class="text-xl">
          {{ t('ptoj.user_profile') }}
        </h1>
      </div>
      <div class="flex gap-4 items-center justify-center px-6 py-24">
        <i class="pi pi-spin pi-spinner text-2xl" />
        <span>{{ loading ? t('ptoj.loading') : t('ptoj.failed_load_profile') }}</span>
      </div>
    </template>

    <div v-else class="p-6">
      <div class="flex gap-2 justify-end">
        <Button icon="pi pi-refresh" severity="secondary" outlined @click="fetch" />
        <Button v-if="isAdmin" icon="pi pi-shield" severity="secondary" outlined @click="gotoUserManagement" />
        <Button v-if="isSelf" icon="pi pi-cog" @click="gotoAccountSettings" />
      </div>
      <div class="gap-6 items-end md:flex mt-18">
        <div class="md:flex-none">
          <img
            v-if="user.avatar" :src="user.avatar" :alt="`${nickname}'s Avatar`"
            class="aspect-square border border-surface h-32 rounded-lg w-32"
          >
          <img v-else src="@/assets/logo.jpg" alt="Default Avatar" class="border border-surface h-32 rounded-lg w-32">
        </div>
        <div class="md:flex-auto">
          <h1 class="font-bold mt-4 text-3xl">
            {{ nickname }}
          </h1>
          <div v-if="username" class="mt-1 text-lg text-muted-color">
            {{ username }}
          </div>
          <div v-if="user.motto" class="mt-2">
            {{ user.motto.trim() }}
          </div>
        </div>
      </div>

      <div class="gap-x-6 gap-y-2 grid grid-cols-1 lg:grid-cols-3 pt-2">
        <div class="lg:col-span-1 space-y-2">
          <Fieldset :legend="t('ptoj.basic_information')">
            <div class="space-y-4">
              <div v-if="user.mail" class="flex gap-3 items-center">
                <i class="m-2 pi pi-envelope text-lg text-muted-color" />
                <div>
                  <div class="text-muted-color text-sm">
                    {{ t('ptoj.email') }}
                  </div>
                  <div class="font-medium">
                    {{ user.mail }}
                  </div>
                </div>
              </div>

              <div v-if="user.school" class="flex gap-3 items-center">
                <i class="m-2 pi pi-building text-lg text-muted-color" />
                <div>
                  <div class="text-muted-color text-sm">
                    {{ t('ptoj.school') }}
                  </div>
                  <div class="font-medium">
                    {{ user.school }}
                  </div>
                </div>
              </div>

              <div class="flex gap-3 items-center">
                <i class="m-2 pi pi-calendar text-lg text-muted-color" />
                <div>
                  <div class="text-muted-color text-sm">
                    {{ t('ptoj.member_since') }}
                  </div>
                  <div class="font-medium">
                    {{ timePretty(user.createdAt, 'yyyy-MM-dd') }}
                  </div>
                </div>
              </div>
            </div>
          </Fieldset>

          <Fieldset
            v-if="user.groups?.length > 0 || user.privilege > UserPrivilege.User"
            :legend="t('ptoj.profile_groups')"
          >
            <div class="flex flex-wrap gap-2 p-2">
              <Tag
                v-if="user.privilege > UserPrivilege.User" :value="getPrivilegeLabel(user.privilege)"
                :severity="getPrivilegeSeverity(user.privilege)"
              />
              <RouterLink
                v-for="group in user.groups" :key="group.gid"
                :to="{ name: 'Ranklist', query: { group: group.gid } }"
              >
                <Tag :value="group.title" severity="secondary" />
              </RouterLink>
            </div>
          </Fieldset>

          <Fieldset v-if="user.codeforces && user.codeforces.rating > 0 " :legend="t('ptoj.codeforces')">
            <CodeforcesProfile :handle="user.codeforces.handle" :rating="user.codeforces.rating" />
          </Fieldset>

          <Fieldset :legend="t('ptoj.statistics')">
            <div class="gap-4 grid grid-cols-2">
              <div class="px-4 py-2">
                <div class="font-bold text-2xl">
                  {{ user.solved.length }}
                </div>
                <div class="mt-1 text-muted-color text-sm">
                  {{ t('ptoj.total_solved') }}
                </div>
              </div>
              <div class="px-4 py-2">
                <div class="font-bold text-2xl">
                  {{ user.solved.length + user.attempted.length }}
                </div>
                <div class="mt-1 text-muted-color text-sm">
                  {{ t('ptoj.total_submitted') }}
                </div>
              </div>
            </div>
          </Fieldset>
        </div>

        <div class="lg:col-span-2 space-y-2">
          <Fieldset :legend="t('ptoj.solved_problems')" toggleable>
            <div v-if="user.solved.length === 0" class="px-6 py-12 text-center text-muted-color">
              <div class="text-lg">
                {{ t('ptoj.empty_content_desc') }}
              </div>
            </div>
            <div v-else class="flex flex-wrap justify-evenly">
              <RouterLink
                v-for="problemId in user.solved" :key="problemId"
                :to="{ name: 'problemInfo', params: { pid: problemId } }"
              >
                <Button class="text-sm" :label="problemId.toString()" link />
              </RouterLink>
            </div>
          </Fieldset>

          <Fieldset :legend="t('ptoj.attempted_problems')" toggleable>
            <div v-if="user.attempted.length === 0" class="px-6 py-12 text-center text-muted-color">
              <div class="text-lg">
                {{ t('ptoj.empty_content_desc') }}
              </div>
            </div>
            <div v-else class="flex flex-wrap justify-evenly">
              <RouterLink
                v-for="problemId in user.attempted" :key="problemId"
                :to="{ name: 'problemInfo', params: { pid: problemId } }"
              >
                <Button class="text-sm" :label="problemId.toString()" link />
              </RouterLink>
            </div>
          </Fieldset>
        </div>
      </div>
    </div>
  </div>
</template>
