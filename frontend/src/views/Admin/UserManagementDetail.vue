<script setup lang="ts">
import type {
  AdminUserDetailQueryResult,
  AdminUserEditPayload,
  AdminUserOAuthQueryResult,
} from '@putongoj/shared'
import type { SessionInfo } from '@/types'
import { OAuthProvider, passwordRegex } from '@putongoj/shared'
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import IconField from 'primevue/iconfield'
import IftaLabel from 'primevue/iftalabel'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'
import { useConfirm } from 'primevue/useconfirm'
import { UAParser } from 'ua-parser-js'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import {
  getUser,
  getUserOAuthConnections,
  listUserSessions,
  removeUserOAuthConnection,
  revokeUserAllSessions,
  revokeUserSession,
  updateUser,
  updateUserPassword,
} from '@/api/admin'
import { useRootStore } from '@/store'
import { useSessionStore } from '@/store/modules/session'
import { privilegeOptions } from '@/utils/constant'
import { encryptData } from '@/utils/crypto'
import { formatRelativeTime, getPrivilegeLabel, getPrivilegeSeverity, timePretty } from '@/utils/format'
import { onRouteParamUpdate } from '@/utils/helper'
import { useMessage } from '@/utils/message'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const confirm = useConfirm()
const message = useMessage()
const sessionStore = useSessionStore()
const { changeDomTitle } = useRootStore()
const { profile, isRoot } = storeToRefs(sessionStore)

const uid = computed(() => route.params.uid as string)
const user = ref<AdminUserDetailQueryResult | null>(null)
const editingUser = ref<AdminUserEditPayload>({})
const connections = ref<AdminUserOAuthQueryResult>({ CJLU: null, Codeforces: null })
const loading = ref(false)
const saving = ref(false)
const passwordDialog = ref(false)
const newPassword = ref('')
const confirmPassword = ref('')
const sessions = ref<SessionInfo[]>([])
const sessionsLoading = ref(false)

const hasChanges = computed(() => {
  if (!user.value) return false
  return editingUser.value.privilege !== user.value.privilege
    || editingUser.value.nick !== user.value.nick
    || editingUser.value.motto !== user.value.motto
    || editingUser.value.mail !== user.value.mail
    || editingUser.value.school !== user.value.school
    || editingUser.value.avatar !== user.value.avatar
})
const isSelf = computed(() => profile.value?.uid === user.value?.uid)
const canOperate = computed(() => {
  if (!profile.value || !user.value) return false
  if (isSelf.value || isRoot.value) return true
  return profile.value.privilege > user.value.privilege
})

function setEditingUser () {
  if (!user.value) return
  editingUser.value = {
    privilege: user.value.privilege,
    nick: user.value.nick,
    motto: user.value.motto,
    mail: user.value.mail,
    school: user.value.school,
    avatar: user.value.avatar,
  }
}

async function fetch () {
  loading.value = true
  fetchSessions()
  const [ userResp, oauthResp ] = await Promise.all([
    getUser(uid.value),
    getUserOAuthConnections(uid.value),
  ])
  loading.value = false
  if (!userResp.success) {
    message.error(t('ptoj.failed_load_user'), userResp.message)
    router.back()
    return
  }
  if (!oauthResp.success) {
    message.error(t('ptoj.failed_load_connect_accounts'), oauthResp.message)
  } else {
    connections.value = oauthResp.data
  }

  user.value = userResp.data
  setEditingUser()
  changeDomTitle({ title: `${user.value.uid} - User Management` })
}

async function saveUser () {
  if (!user.value || !profile.value) return

  const payload: AdminUserEditPayload = {}
  if (editingUser.value.privilege !== user.value.privilege) {
    payload.privilege = editingUser.value.privilege
  }
  if (editingUser.value.nick !== user.value.nick) {
    payload.nick = editingUser.value.nick
  }
  if (editingUser.value.motto !== user.value.motto) {
    payload.motto = editingUser.value.motto
  }
  if (editingUser.value.mail !== user.value.mail) {
    payload.mail = editingUser.value.mail
  }
  if (editingUser.value.school !== user.value.school) {
    payload.school = editingUser.value.school
  }
  if (editingUser.value.avatar !== user.value.avatar) {
    payload.avatar = editingUser.value.avatar
  }

  saving.value = true
  const resp = await updateUser(uid.value, payload)
  saving.value = false

  if (!resp.success) {
    message.error(t('ptoj.failed_save_changes'), resp.message)
    return
  }

  message.success(t('ptoj.successful_updated'), t('ptoj.user_updated_detail'))
  user.value = resp.data
  setEditingUser()
}

async function changePassword () {
  if (newPassword.value !== confirmPassword.value) {
    message.error(t('ptoj.password_mismatch'), t('ptoj.password_mismatch_detail'))
    return
  }
  if (passwordRegex.test(newPassword.value) === false) {
    message.error(t('ptoj.password_weak'), t('ptoj.password_weak_detail'))
    return
  }

  saving.value = true
  const resp = await updateUserPassword(uid.value, {
    newPassword: await encryptData(newPassword.value),
  })
  saving.value = false
  if (!resp.success) {
    message.error(t('ptoj.failed_update_password'), resp.message)
    return
  }

  message.success(t('ptoj.successful_updated'), t('ptoj.password_updated_detail'))
  passwordDialog.value = false
}

function disconnectOAuth (event: Event, provider: OAuthProvider) {
  confirm.require({
    target: event.currentTarget as HTMLElement,
    message: t('ptoj.proceed_confirm_message'),
    rejectProps: {
      label: t('ptoj.cancel'),
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: t('ptoj.disconnect'),
      severity: 'danger',
    },
    accept: async () => {
      const result = await removeUserOAuthConnection(uid.value, provider)
      if (!result.success) {
        message.error(t('ptoj.failed_proceed'), result.message)
        return
      }
      connections.value[provider] = null
      message.success(t('ptoj.successful_proceed'), t('ptoj.account_disconnected_detail'))
    },
  })
}

function openPasswordDialog () {
  passwordDialog.value = true
  newPassword.value = ''
  confirmPassword.value = ''
}

async function fetchSessions () {
  sessionsLoading.value = true
  const resp = await listUserSessions(uid.value)
  sessionsLoading.value = false

  if (!resp.success) {
    message.error(t('ptoj.failed_fetch_sessions'), resp.message)
    return
  }
  sessions.value = resp.data.map((session) => {
    const { browser, os } = UAParser(session.userAgent)
    const lastAccessAt = new Date(session.lastAccessAt)
    const ACTIVE_THRESHOLD = 1000 * 60 * 60 // 1 hour
    return {
      ...session,
      lastAccessAt,
      os: os.toString() || 'Unknown',
      browser: browser.toString() || 'Unknown',
      active: Date.now() - lastAccessAt.getTime() < ACTIVE_THRESHOLD,
    }
  }).sort((a, b) => b.lastAccessAt.getTime() - a.lastAccessAt.getTime())
}

async function revokeUserSessionById (sessionId: string) {
  const resp = await revokeUserSession(uid.value, sessionId)
  if (!resp.success) {
    message.error(t('ptoj.failed_logout_session'), resp.message)
    return
  }
  message.success(t('ptoj.session_logged_out'), t('ptoj.session_logged_out_detail'))
  await fetchSessions()
}

function confirmRevokeAllUserSessions (event: Event) {
  confirm.require({
    target: event.currentTarget as HTMLElement,
    message: t('ptoj.proceed_confirm_message'),
    rejectProps: {
      label: t('ptoj.cancel'),
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: t('ptoj.logout_all_sessions'),
      severity: 'danger',
    },
    accept: async () => {
      const resp = await revokeUserAllSessions(uid.value)
      if (!resp.success) {
        message.error(t('ptoj.failed_logout_session'), resp.message)
        return
      }
      message.success(t('ptoj.session_logged_out'), t('ptoj.sessions_logged_out_detail', { count: resp.data.removed }))
      await fetchSessions()
    },
  })
}

onMounted(fetch)
onRouteParamUpdate(fetch)
</script>

<template>
  <div class="max-w-4xl p-0">
    <div class="flex font-semibold gap-4 items-center pt-6 px-6">
      <i class="pi pi-user-edit text-2xl" />
      <h1 class="text-xl">
        {{ t('ptoj.user_management') }}
      </h1>
    </div>

    <template v-if="loading || !user">
      <div class="flex gap-4 items-center justify-center px-6 py-24">
        <i class="pi pi-spin pi-spinner text-2xl" />
        <span>{{ loading ? t('ptoj.loading') : t('ptoj.failed_load_profile') }}</span>
      </div>
    </template>

    <template v-else>
      <div class="border-b border-surface gap-x-4 gap-y-6 grid grid-cols-1 md:grid-cols-2 p-6 pt-5">
        <Message v-if="!canOperate" class="md:col-span-2" severity="warn" variant="outlined" icon="pi pi-info-circle">
          {{ t('ptoj.user_management_cannot_operate_desc') }}
        </Message>

        <IftaLabel>
          <InputText id="username" :value="user.uid" fluid readonly />
          <label for="username">{{ t('ptoj.username') }}</label>
        </IftaLabel>

        <IftaLabel>
          <Select
            v-if="!isSelf && (user.privilege < profile!.privilege || isRoot)" id="privilege"
            v-model="editingUser.privilege" fluid :options="privilegeOptions" option-label="label" option-value="value"
            :option-disabled="(option) => !isRoot && option.value >= profile!.privilege"
          >
            <template #option="slotProps">
              <Tag
                :value="getPrivilegeLabel(slotProps.option.value)"
                :severity="getPrivilegeSeverity(slotProps.option.value)"
              />
            </template>
          </Select>
          <IconField v-else>
            <InputText id="privilege" :value="getPrivilegeLabel(user.privilege)" fluid readonly />
            <InputIcon class="pi pi-lock" />
          </IconField>
          <label for="privilege">{{ t('ptoj.privilege') }}</label>
        </IftaLabel>

        <IftaLabel>
          <InputText
            id="nickname" v-model="editingUser.nick" fluid maxlength="30"
            :placeholder="t('ptoj.enter_nickname')" :readonly="!canOperate"
          />
          <label for="nickname">{{ t('ptoj.nickname') }}</label>
        </IftaLabel>

        <IftaLabel>
          <InputText
            id="email" v-model="editingUser.mail" fluid type="email" maxlength="254"
            :placeholder="t('ptoj.enter_email')" :readonly="!canOperate"
          />
          <label for="email">{{ t('ptoj.email') }}</label>
        </IftaLabel>

        <IftaLabel>
          <InputText
            id="school" v-model="editingUser.school" fluid maxlength="30"
            :placeholder="t('ptoj.enter_school')" :readonly="!canOperate"
          />
          <label for="school">{{ t('ptoj.school') }}</label>
        </IftaLabel>

        <IftaLabel>
          <InputText
            id="avatar" v-model="editingUser.avatar" fluid maxlength="300"
            :placeholder="t('ptoj.enter_avatar_url')" :readonly="!canOperate || !isRoot"
          />
          <label for="avatar">{{ t('ptoj.avatar') }}</label>
        </IftaLabel>

        <IftaLabel class="-mb-1.5 md:col-span-2">
          <Textarea
            id="motto" v-model="editingUser.motto" fluid rows="3" maxlength="300"
            :placeholder="t('ptoj.enter_motto')" auto-resize :readonly="!canOperate"
          />
          <label for="motto">{{ t('ptoj.motto') }}</label>
        </IftaLabel>

        <div class="flex gap-2 justify-end md:col-span-2">
          <Button icon="pi pi-refresh" severity="secondary" outlined :loading="loading" @click="fetch" />
          <Button
            :label="t('ptoj.save_changes')" icon="pi pi-check" :loading="saving"
            :disabled="!canOperate || !hasChanges" @click="saveUser"
          />
        </div>
      </div>

      <div class="border-b border-surface p-6">
        <h2 class="font-semibold mb-5 text-lg">
          {{ t('ptoj.connect_accounts') }}
        </h2>
        <div class="border border-surface rounded-lg">
          <div class="border-b border-surface flex gap-4 items-center justify-between p-4">
            <div>
              <div class="font-medium">
                {{ t('ptoj.cjlu_sso') }}
              </div>
              <div class="text-muted-color text-sm">
                <span v-if="connections.CJLU">
                  {{ t('ptoj.connected_to_detail', {
                    id: connections.CJLU.providerId,
                    name: connections.CJLU.displayName,
                    time: timePretty(connections.CJLU.createdAt),
                  }) }}
                </span>
                <span v-else>{{ t('ptoj.not_connected') }}</span>
              </div>
            </div>
            <Button
              v-if="connections.CJLU" :label="t('ptoj.disconnect')" severity="danger" outlined
              :disabled="!canOperate || !isRoot" class="min-w-fit"
              @click="event => disconnectOAuth(event, OAuthProvider.CJLU)"
            />
          </div>
          <div class="flex gap-4 items-center justify-between p-4">
            <div>
              <div class="font-medium">
                {{ t('ptoj.codeforces') }}
              </div>
              <div class="text-muted-color text-sm">
                <span v-if="connections.Codeforces">
                  {{ t('ptoj.connected_to_detail', {
                    id: connections.Codeforces.displayName,
                    name: connections.Codeforces.providerId.slice(0, 7),
                    time: timePretty(connections.Codeforces.createdAt),
                  }) }}
                </span>
                <span v-else>{{ t('ptoj.not_connected') }}</span>
              </div>
            </div>
            <Button
              v-if="connections.Codeforces" :label="t('ptoj.disconnect')" severity="danger" outlined
              :disabled="!canOperate || !isRoot" class="min-w-fit"
              @click="event => disconnectOAuth(event, OAuthProvider.Codeforces)"
            />
          </div>
        </div>
      </div>

      <div class="border-b border-surface p-6">
        <h2 class="font-semibold mb-3 text-lg">
          {{ t('ptoj.change_password') }}
        </h2>
        <p class="mb-5 text-muted-color text-sm">
          {{ t('ptoj.change_password_admin_desc') }}
        </p>
        <Button
          :label="t('ptoj.change_password')" icon="pi pi-key" severity="warning" :disabled="!canOperate"
          @click="openPasswordDialog"
        />
      </div>

      <div class="border-b border-surface p-6">
        <h2 class="font-semibold mb-5 text-lg">
          {{ t('ptoj.active_sessions') }}
        </h2>
        <div class="border border-surface rounded-lg">
          <div v-if="sessionsLoading" class="flex gap-4 items-center justify-center p-6">
            <i class="pi pi-spin pi-spinner text-2xl" />
            <span>{{ t('ptoj.loading') }}</span>
          </div>

          <template v-else>
            <div
              v-for="session in sessions" :key="session.sessionId"
              class="border-b border-surface flex gap-2 items-start justify-between last:border-0 p-4"
            >
              <div class="space-y-1">
                <div class="flex gap-2.5 items-center">
                  <!-- Current -->
                  <span v-if="session.current" class="flex relative size-3">
                    <span class="absolute animate-ping bg-green-400 h-full rounded-full w-full" />
                    <span class="bg-green-500 h-full relative rounded-full w-full" />
                  </span>
                  <!-- Active -->
                  <span v-else-if="session.active" class="flex relative size-3">
                    <span class="absolute animate-ping bg-sky-400 h-full rounded-full w-full" />
                    <span class="bg-sky-500 h-full relative rounded-full w-full" />
                  </span>
                  <!-- Stale -->
                  <span v-else class="flex relative size-3">
                    <span class="bg-gray-500 h-full relative rounded-full w-full" />
                  </span>

                  <span class="font-medium">{{ session.os }}</span>
                  <span class="text-muted-color text-sm">{{ session.browser }}</span>
                </div>

                <div>
                  <template v-if="session.current">
                    {{ t('ptoj.current_session') }}
                  </template>
                  <template v-else>
                    {{ t('ptoj.last_active_relative', { time: formatRelativeTime(session.lastAccessAt, locale) }) }}
                  </template>
                </div>

                <div class="text-muted-color text-sm">
                  {{ t('ptoj.login_info', { ip: session.loginIp, time: formatRelativeTime(session.loginAt, locale) }) }}
                </div>
              </div>

              <Button
                class="shrink-0" :label="t('ptoj.logout')" severity="danger" outlined
                :disabled="session.current" @click="revokeUserSessionById(session.sessionId)"
              />
            </div>
          </template>
        </div>

        <div class="flex justify-end mt-6">
          <Button
            :label="t('ptoj.logout_all_sessions')" icon="pi pi-sign-out" severity="danger" outlined
            :disabled="sessions.length === 0" @click="confirmRevokeAllUserSessions"
          />
        </div>
      </div>

      <div class="p-6">
        <h2 class="font-semibold mb-5 text-lg">
          {{ t('ptoj.audit_information') }}
        </h2>
        <div class="gap-x-4 gap-y-6 grid grid-cols-1 md:grid-cols-2">
          <IftaLabel>
            <InputText id="created-at" :value="timePretty(user.createdAt)" fluid readonly />
            <label for="created-at">{{ t('ptoj.created_at') }}</label>
          </IftaLabel>
          <IftaLabel>
            <InputText
              id="last-visited-at" :value="user.lastVisitedAt ? timePretty(user.lastVisitedAt) : 'Unknown'"
              fluid readonly
            />
            <label for="last-visited-at">{{ t('ptoj.last_visited_at') }}</label>
          </IftaLabel>
          <IftaLabel class="md:col-span-2">
            <InputText id="last-request-id" :value="user.lastRequestId ?? 'N/A'" class="font-mono" fluid readonly />
            <label for="last-request-id">{{ t('ptoj.last_request_id') }}</label>
          </IftaLabel>
        </div>
      </div>
    </template>

    <Dialog
      v-model:visible="passwordDialog" modal :header="t('ptoj.change_password')" :closable="false"
      class="max-w-md mx-6 w-full"
    >
      <form @submit.prevent="changePassword">
        <div class="space-y-4">
          <IftaLabel>
            <InputText
              id="new-password" v-model="newPassword" fluid type="password"
              :placeholder="t('ptoj.enter_new_password')" required autocomplete="new-password"
            />
            <label for="new-password">{{ t('ptoj.new_password') }}</label>
          </IftaLabel>
          <IftaLabel>
            <InputText
              id="confirm-password" v-model="confirmPassword" fluid type="password"
              :placeholder="t('ptoj.enter_confirm_new_password')" required autocomplete="new-password"
              :invalid="!!confirmPassword && confirmPassword !== newPassword"
            />
            <label for="confirm-password">{{ t('ptoj.confirm_new_password') }}</label>
          </IftaLabel>
        </div>
        <div class="flex gap-2 justify-end mt-5">
          <Button
            type="button" :label="t('ptoj.cancel')" icon="pi pi-times" severity="secondary" outlined
            @click="passwordDialog = false"
          />
          <Button type="submit" :label="t('ptoj.change_password')" icon="pi pi-check" :loading="saving" />
        </div>
      </form>
    </Dialog>
  </div>
</template>
