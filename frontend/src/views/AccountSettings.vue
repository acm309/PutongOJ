<script lang="ts" setup>
import type {
  AccountEditPayload,
  AccountProfileQueryResult,
} from '@putongoj/shared'
import { OAuthAction } from '@putongoj/shared'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import IftaLabel from 'primevue/iftalabel'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import { computed, onMounted, ref } from 'vue'
import { getProfile, updatePassword, updateProfile } from '@/api/account'
import { generateOAuthUrl, getUserOAuthConnections } from '@/api/oauth'
import { useRootStore } from '@/store'
import { useSessionStore } from '@/store/modules/session'
import { encryptData } from '@/utils/crypto'
import { useMessage } from '@/utils/message'

interface OAuthConnection {
  displayName: string
  providerId: string
}

const message = useMessage()
const { setProfile } = useSessionStore()
const { changeDomTitle } = useRootStore()

const profile = ref<AccountProfileQueryResult | null>(null)
const editingProfile = ref<AccountEditPayload>({})
const connections = ref<Record<string, OAuthConnection | null>>({})
const loading = ref(false)
const saving = ref(false)
const passwordDialog = ref(false)
const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

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

async function fetch () {
  loading.value = true
  const resp = await getProfile()
  loading.value = false
  if (!resp.success) {
    message.error('Failed to load profile', resp.message)
    return
  }

  profile.value = resp.data
  setEditingProfile()
  changeDomTitle({ title: 'Account Settings' })
}

async function fetchConnections () {
  connections.value = await getUserOAuthConnections()
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

  if (Object.keys(payload).length === 0) {
    message.info('No changes detected', 'Your profile information remains unchanged')
    return
  }

  saving.value = true
  const resp = await updateProfile(payload)
  saving.value = false

  if (!resp.success) {
    message.error('Failed to save changes', resp.message)
    return
  }

  message.success('Profile updated', 'Your profile information has been saved successfully')
  profile.value = resp.data
  setEditingProfile()
  setProfile(resp.data)
}

async function changePassword () {
  if (!oldPassword.value || !newPassword.value || !confirmPassword.value) {
    message.error('All fields required', 'Please fill in all password fields')
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    message.error('Password mismatch', 'The new passwords you entered do not match')
    return
  }
  if (/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(newPassword.value) === false) {
    message.error('Weak password', 'Password must be at least 8 characters long and include uppercase letters, lowercase letters, and numbers')
    return
  }

  saving.value = true
  const resp = await updatePassword({
    oldPassword: await encryptData(oldPassword.value),
    newPassword: await encryptData(newPassword.value),
  })
  saving.value = false
  if (!resp.success) {
    message.error('Password update failed', resp.message)
    return
  }

  message.success('Password updated', 'Your password has been changed successfully')
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

onMounted(async () => {
  await Promise.all([ fetch(), fetchConnections() ])
})
</script>

<template>
  <div class="max-w-4xl p-0">
    <div class="flex font-semibold gap-4 items-center pt-6 px-6">
      <i class="pi pi-user-edit text-2xl" />
      <h1 class="text-xl">
        Account Settings
      </h1>
    </div>

    <template v-if="loading || !profile">
      <div class="flex gap-4 items-center justify-center px-6 py-24">
        <i class="pi pi-spin pi-spinner text-2xl" />
        <span>{{ loading ? 'Loading profile...' : 'Failed to load profile' }}</span>
      </div>
    </template>

    <template v-else>
      <div class="border-b border-surface gap-x-4 gap-y-6 grid grid-cols-1 md:grid-cols-2 p-6">
        <IftaLabel>
          <InputText id="username" :value="profile.uid" class="w-full" readonly />
          <label for="username">Username</label>
        </IftaLabel>

        <IftaLabel>
          <InputText
            id="nickname" v-model="editingProfile.nick" class="w-full" maxlength="30"
            placeholder="Enter nickname"
          />
          <label for="nickname">Nickname</label>
        </IftaLabel>

        <IftaLabel>
          <InputText
            id="email" v-model="editingProfile.mail" class="w-full" type="email" maxlength="254"
            placeholder="Enter email address"
          />
          <label for="email">Email</label>
        </IftaLabel>

        <IftaLabel>
          <InputText
            id="school" v-model="editingProfile.school" class="w-full" maxlength="30"
            placeholder="Enter school"
          />
          <label for="school">School</label>
        </IftaLabel>

        <IftaLabel class="-mb-[5px] md:col-span-2">
          <Textarea
            id="motto" v-model="editingProfile.motto" class="w-full" rows="3" maxlength="300"
            placeholder="Enter motto" auto-resize
          />
          <label for="motto">Motto</label>
        </IftaLabel>

        <div class="flex gap-2 justify-end md:col-span-2">
          <Button icon="pi pi-refresh" severity="secondary" outlined :loading="loading" @click="fetch" />
          <Button
            label="Save Changes" icon="pi pi-check" :loading="saving" :disabled="!hasChanges"
            @click="saveProfile"
          />
        </div>
      </div>

      <div class="border-b border-surface p-6">
        <h2 class="font-semibold mb-4 text-lg">
          Connections
        </h2>
        <div class="space-y-4">
          <div class="border border-surface flex items-center justify-between p-4 rounded-lg">
            <div>
              <div class="font-medium">
                China Jiliang University SSO
              </div>
              <div class="text-sm text-surface-600">
                <span v-if="connections.CJLU">
                  Connected as {{ connections.CJLU.providerId }}
                </span>
                <span v-else>Not connected</span>
              </div>
            </div>
            <Button
              :label="connections.CJLU ? 'Connected' : 'Connect'" :disabled="!!connections.CJLU"
              @click="connectOAuth('cjlu')"
            />
          </div>
          <p class="text-sm text-surface-600">
            Connecting external accounts allows you to log in using those services.
          </p>
        </div>
      </div>

      <div class="p-6">
        <h2 class="font-semibold mb-4 text-lg">
          Password
        </h2>
        <div class="space-y-4">
          <p class="text-sm text-surface-600">
            Change your password. This will log you out from all active sessions.
          </p>
          <Button label="Change Password" icon="pi pi-key" severity="warning" @click="openPasswordDialog" />
        </div>
      </div>
    </template>

    <Dialog
      v-model:visible="passwordDialog" modal header="Change Password" :closable="false"
      class="max-w-md mx-6 w-full"
    >
      <form @submit.prevent="changePassword">
        <div class="space-y-4">
          <IftaLabel>
            <InputText
              id="old-password" v-model="oldPassword" class="w-full" type="password"
              placeholder="Enter current password" required autocomplete="current-password"
            />
            <label for="old-password">Current Password</label>
          </IftaLabel>
          <IftaLabel>
            <InputText
              id="new-password" v-model="newPassword" class="w-full" type="password"
              placeholder="Enter new password" required autocomplete="new-password"
            />
            <label for="new-password">New Password</label>
          </IftaLabel>
          <IftaLabel>
            <InputText
              id="confirm-password" v-model="confirmPassword" class="w-full" type="password"
              placeholder="Confirm new password" required autocomplete="new-password"
              :invalid="!!confirmPassword && confirmPassword !== newPassword"
            />
            <label for="confirm-password">Confirm Password</label>
          </IftaLabel>
        </div>
        <div class="flex gap-2 justify-end mt-6">
          <Button
            type="button" label="Cancel" icon="pi pi-times" severity="secondary" outlined
            @click="passwordDialog = false"
          />
          <Button type="submit" label="Change Password" icon="pi pi-check" :loading="saving" />
        </div>
      </form>
    </Dialog>
  </div>
</template>
