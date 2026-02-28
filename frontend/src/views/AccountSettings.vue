<script setup lang="ts">
import type {
  AccountEditPayload,
  AccountProfileQueryResult,
} from '@putongoj/shared'
import type { SessionInfo } from '@/types'
import { ErrorCode, OAuthAction, passwordRegex } from '@putongoj/shared'
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import IftaLabel from 'primevue/iftalabel'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import { useConfirm } from 'primevue/useconfirm'
import { UAParser } from 'ua-parser-js'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { getProfile, listSessions, revokeOtherSessions, revokeSession, updatePassword, updateProfile } from '@/api/account'
import { generateOAuthUrl, getUserOAuthConnections } from '@/api/oauth'
import { getAvatarPresets } from '@/api/utils'
import UserAvatar from '@/components/UserAvatar.vue'
import { useSessionStore } from '@/store/modules/session'
import { encryptData } from '@/utils/crypto'
import { formatRelativeTime } from '@/utils/format'
import { useMessage } from '@/utils/message'

interface OAuthConnection {
  displayName: string
  providerId: string
}

const { t, locale } = useI18n()
const router = useRouter()
const confirm = useConfirm()
const message = useMessage()
const sessionStore = useSessionStore()
const { isAdmin } = storeToRefs(sessionStore)

const profile = ref<AccountProfileQueryResult | null>(null)
const editingProfile = ref<AccountEditPayload>({})
const connections = ref<Record<string, OAuthConnection | null>>({})
const loading = ref(false)
const saving = ref(false)
const passwordDialog = ref(false)
const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const sessions = ref<SessionInfo[]>([])
const sessionsLoading = ref(false)
const avatarPresets = ref<string[]>([])
const avatarDialog = ref(false)
const selectedAvatar = ref('')
const savingAvatar = ref(false)

const hasChanges = computed(() => {
  if (!profile.value) return false
  return editingProfile.value.nick !== profile.value.nick
    || editingProfile.value.motto !== profile.value.motto
    || editingProfile.value.mail !== profile.value.mail
    || editingProfile.value.school !== profile.value.school
})

function setEditingProfile () {
  if (!profile.value) return
  editingProfile.value = {
    nick: profile.value.nick,
    motto: profile.value.motto,
    mail: profile.value.mail,
    school: profile.value.school,
  }
}

function openAvatarDialog () {
  if (!profile.value || (avatarPresets.value.length === 0 && !profile.value.avatar)) return
  selectedAvatar.value = profile.value.avatar
  avatarDialog.value = true
}

async function saveAvatar () {
  if (!profile.value || selectedAvatar.value === profile.value.avatar) {
    avatarDialog.value = false
    return
  }

  savingAvatar.value = true
  const resp = await updateProfile({ avatar: selectedAvatar.value })
  savingAvatar.value = false

  if (!resp.success) {
    message.error(t('ptoj.failed_save_changes'), resp.message)
    return
  }

  profile.value = resp.data
  sessionStore.setProfile(resp.data)
  avatarDialog.value = false
}

async function fetch () {
  loading.value = true
  const [ profileResp, oauthResp, presetsResp ] = await Promise.all([
    getProfile(),
    getUserOAuthConnections(),
    getAvatarPresets(),
  ])
  loading.value = false
  if (!profileResp.success) {
    message.error(t('ptoj.failed_load_profile'), profileResp.message)
    return
  }

  connections.value = oauthResp
  profile.value = profileResp.data
  if (presetsResp.success) {
    avatarPresets.value = presetsResp.data
  }
  setEditingProfile()
}

async function saveProfile () {
  if (!profile.value) return

  const payload: AccountEditPayload = {}
  if (editingProfile.value.nick !== profile.value.nick) {
    payload.nick = editingProfile.value.nick
  }
  if (editingProfile.value.motto !== profile.value.motto) {
    payload.motto = editingProfile.value.motto
  }
  if (editingProfile.value.mail !== profile.value.mail) {
    payload.mail = editingProfile.value.mail
  }
  if (editingProfile.value.school !== profile.value.school) {
    payload.school = editingProfile.value.school
  }

  saving.value = true
  const resp = await updateProfile(payload)
  saving.value = false

  if (!resp.success) {
    message.error(t('ptoj.failed_save_changes'), resp.message)
    return
  }

  message.success(t('ptoj.successful_updated'), t('ptoj.profile_updated_detail'))
  profile.value = resp.data
  setEditingProfile()
  sessionStore.setProfile(resp.data)
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
  const resp = await updatePassword({
    oldPassword: await encryptData(oldPassword.value),
    newPassword: await encryptData(newPassword.value),
  })
  saving.value = false
  if (!resp.success) {
    message.error(
      t('ptoj.failed_update_password'),
      resp.code === ErrorCode.Unauthorized
        ? t('ptoj.password_current_incorrect')
        : resp.message,
    )
    return
  }

  message.success(t('ptoj.successful_updated'), t('ptoj.password_updated_detail'))
  passwordDialog.value = false
}

function openPasswordDialog () {
  passwordDialog.value = true
  oldPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
}

async function connectOAuth (provider: string) {
  const resp = await generateOAuthUrl(provider.toLowerCase() as any, { action: OAuthAction.CONNECT })
  window.open(resp.url, '_self', 'noopener,noreferrer')
}

function gotoUserManagement () {
  if (!isAdmin.value || !profile.value) return
  router.push({ name: 'UserManagementDetail', params: { uid: profile.value.uid } })
}

async function fetchSessions () {
  sessionsLoading.value = true
  const resp = await listSessions()
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

async function revokeSessionById (sessionId: string) {
  const resp = await revokeSession(sessionId)
  if (!resp.success) {
    message.error(t('ptoj.failed_logout_session'), resp.message)
    return
  }
  message.success(t('ptoj.session_logged_out'), t('ptoj.session_logged_out_detail'))
  await fetchSessions()
}

function confirmRevokeOthers (event: Event) {
  confirm.require({
    target: event.currentTarget as HTMLElement,
    message: t('ptoj.proceed_confirm_message'),
    rejectProps: {
      label: t('ptoj.cancel'),
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: t('ptoj.logout_other_sessions'),
      severity: 'danger',
    },
    accept: async () => {
      const resp = await revokeOtherSessions()
      if (!resp.success) {
        message.error(t('ptoj.failed_logout_session'), resp.message)
        return
      }
      message.success(t('ptoj.session_logged_out'), t('ptoj.sessions_logged_out_detail', { count: resp.data.removed }))
      await fetchSessions()
    },
  })
}

onMounted(() => {
  fetch()
  fetchSessions()
})
</script>

<template>
  <div class="max-w-4xl p-0">
    <div class="flex font-semibold gap-4 items-center pt-6 px-6">
      <i class="pi pi-cog text-2xl" />
      <h1 class="text-xl">
        {{ t('ptoj.account_settings') }}
      </h1>
    </div>

    <template v-if="loading || !profile">
      <div class="flex gap-4 items-center justify-center px-6 py-24">
        <i class="pi pi-spin pi-spinner text-2xl" />
        <span>{{ loading ? t('ptoj.loading') : t('ptoj.failed_load_profile') }}</span>
      </div>
    </template>

    <template v-else>
      <div class="border-b border-surface gap-x-4 gap-y-6 grid grid-cols-1 md:grid-cols-2 p-6 pt-5">
        <div class="flex gap-4 items-center md:col-span-2">
          <div class="cursor-pointer flex group relative" @click="openAvatarDialog">
            <UserAvatar :image="profile.avatar" class="h-20 shadow-xs w-20" />
            <div
              v-if="avatarPresets.length > 0 || profile.avatar"
              class="absolute bg-black/50 flex group-hover:opacity-100 inset-0 items-center justify-center opacity-0 rounded-md transition-opacity"
            >
              <i class="pi pi-pencil text-white" />
            </div>
          </div>
        </div>

        <IftaLabel>
          <InputText id="username" :value="profile.uid" fluid readonly />
          <label for="username">{{ t('ptoj.username') }}</label>
        </IftaLabel>

        <IftaLabel>
          <InputText
            id="nickname" v-model="editingProfile.nick" fluid maxlength="30"
            :placeholder="t('ptoj.enter_nickname')"
          />
          <label for="nickname">{{ t('ptoj.nickname') }}</label>
        </IftaLabel>

        <IftaLabel>
          <InputText
            id="email" v-model="editingProfile.mail" fluid type="email" maxlength="254"
            :placeholder="t('ptoj.enter_email')"
          />
          <label for="email">{{ t('ptoj.email') }}</label>
        </IftaLabel>

        <IftaLabel>
          <InputText
            id="school" v-model="editingProfile.school" fluid maxlength="30"
            :placeholder="t('ptoj.enter_school')"
          />
          <label for="school">{{ t('ptoj.school') }}</label>
        </IftaLabel>

        <IftaLabel class="-mb-1.5 md:col-span-2">
          <Textarea
            id="motto" v-model="editingProfile.motto" fluid rows="3" maxlength="300"
            :placeholder="t('ptoj.enter_motto')" auto-resize
          />
          <label for="motto">{{ t('ptoj.motto') }}</label>
        </IftaLabel>

        <div class="flex gap-2 justify-end md:col-span-2">
          <Button v-if="isAdmin" icon="pi pi-shield" severity="secondary" outlined @click="gotoUserManagement" />
          <Button icon="pi pi-refresh" severity="secondary" outlined :loading="loading" @click="fetch" />
          <Button
            :label="t('ptoj.save_changes')" icon="pi pi-check" :loading="saving" :disabled="!hasChanges"
            @click="saveProfile"
          />
        </div>
      </div>

      <div class="border-b border-surface p-6">
        <h2 class="font-semibold mb-3 text-lg">
          {{ t('ptoj.connect_accounts') }}
        </h2>
        <p class="mb-5 text-muted-color text-sm">
          {{ t('ptoj.connect_accounts_desc') }}
        </p>
        <div class="border border-surface rounded-lg">
          <div class="border-b border-surface flex gap-4 items-center justify-between p-4">
            <div>
              <div class="font-medium">
                {{ t('ptoj.cjlu_sso') }}
              </div>
              <div class="text-muted-color text-sm">
                <span v-if="connections.CJLU">
                  {{ t('ptoj.connected_to_brief', { display: connections.CJLU.providerId }) }}
                </span>
                <span v-else>{{ t('ptoj.not_connected') }}</span>
              </div>
            </div>
            <Button
              :label="connections.CJLU ? t('ptoj.connected') : t('ptoj.connect')" :disabled="!!connections.CJLU"
              @click="connectOAuth('cjlu')"
            />
          </div>
          <div class="flex gap-4 items-center justify-between p-4">
            <div>
              <div class="font-medium">
                {{ t('ptoj.codeforces') }}
              </div>
              <div class="text-muted-color text-sm">
                <span v-if="connections.Codeforces">
                  {{ t('ptoj.connected_to_brief', { display: connections.Codeforces.displayName }) }}
                </span>
                <span v-else>{{ t('ptoj.not_connected') }}</span>
              </div>
            </div>
            <Button
              :label="connections.Codeforces ? t('ptoj.connected') : t('ptoj.connect')" :disabled="!!connections.Codeforces"
              @click="connectOAuth('codeforces')"
            />
          </div>
        </div>
      </div>

      <div class="border-b border-surface p-6">
        <h2 class="font-semibold mb-3 text-lg">
          {{ t('ptoj.change_password') }}
        </h2>
        <p class="mb-5 text-muted-color text-sm">
          {{ t('ptoj.change_password_desc') }}
        </p>
        <Button :label="t('ptoj.change_password')" icon="pi pi-key" severity="warning" @click="openPasswordDialog" />
      </div>

      <div class="p-6">
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
                :disabled="session.current" @click="revokeSessionById(session.sessionId)"
              />
            </div>
          </template>
        </div>

        <div class="flex justify-end mt-6">
          <Button
            :label="t('ptoj.logout_other_sessions')" icon="pi pi-sign-out" severity="danger" outlined
            :disabled="sessions.length === 0" @click="confirmRevokeOthers"
          />
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
              id="old-password" v-model="oldPassword" fluid type="password"
              :placeholder="t('ptoj.enter_current_password')" required autocomplete="current-password"
            />
            <label for="old-password">{{ t('ptoj.current_password') }}</label>
          </IftaLabel>
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

    <Dialog v-model:visible="avatarDialog" modal :header="t('ptoj.change_avatar')" class="max-w-lg mx-6 w-full">
      <div
        v-if="profile && profile.avatar && !avatarPresets.includes(profile.avatar)"
        class="mb-4 text-muted-color text-sm"
      >
        {{ t('ptoj.custom_avatar_hint') }}
      </div>

      <div class="flex flex-wrap gap-2 justify-center">
        <!-- Default (empty) avatar option -->
        <div
          class="border-2 cursor-pointer flex p-1.5 rounded-xl transition-colors"
          :class="selectedAvatar === '' ? 'border-primary' : 'border-transparent hover:border-surface-300'"
          @click="selectedAvatar = ''"
        >
          <UserAvatar image="" shape="square" size="xlarge" />
        </div>

        <!-- Current custom avatar (admin-set, not in presets) -->
        <div
          v-if="profile && profile.avatar && !avatarPresets.includes(profile.avatar)"
          class="border-2 cursor-pointer flex p-1.5 rounded-xl transition-colors"
          :class="selectedAvatar === profile.avatar ? 'border-primary' : 'border-transparent hover:border-surface-300'"
          @click="selectedAvatar = profile.avatar"
        >
          <UserAvatar :image="profile.avatar" shape="square" size="xlarge" />
        </div>

        <!-- Preset avatars -->
        <div
          v-for="preset in avatarPresets" :key="preset"
          class="border-2 cursor-pointer flex p-1.5 rounded-xl transition-colors"
          :class="selectedAvatar === preset ? 'border-primary' : 'border-transparent hover:border-surface-300'"
          @click="selectedAvatar = preset"
        >
          <UserAvatar :image="preset" shape="square" size="xlarge" />
        </div>
      </div>

      <div class="flex gap-2 justify-end mt-5">
        <Button
          :label="t('ptoj.cancel')" icon="pi pi-times" severity="secondary" outlined
          @click="avatarDialog = false"
        />
        <Button
          :label="t('ptoj.save_changes')" icon="pi pi-check" :loading="savingAvatar"
          :disabled="profile !== null && selectedAvatar === profile.avatar" @click="saveAvatar"
        />
      </div>
    </Dialog>
  </div>
</template>
