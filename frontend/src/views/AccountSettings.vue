<script lang="ts" setup>
import type {
  AccountEditPayload,
  AccountProfileQueryResult,
} from '@putongoj/shared'
import { ErrorCode, OAuthAction } from '@putongoj/shared'
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import IftaLabel from 'primevue/iftalabel'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { getProfile, updatePassword, updateProfile } from '@/api/account'
import { generateOAuthUrl, getUserOAuthConnections } from '@/api/oauth'
import { useSessionStore } from '@/store/modules/session'
import { encryptData } from '@/utils/crypto'
import { useMessage } from '@/utils/message'

interface OAuthConnection {
  displayName: string
  providerId: string
}

const { t } = useI18n()
const router = useRouter()
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
  const [ profileResp, oauthResp ] = await Promise.all([
    getProfile(),
    getUserOAuthConnections(),
  ])
  loading.value = false
  if (!profileResp.success) {
    message.error(t('ptoj.failed_load_profile'), profileResp.message)
    return
  }

  connections.value = oauthResp
  profile.value = profileResp.data
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
  if (/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(newPassword.value) === false) {
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

onMounted(fetch)
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
      <div class="border-b border-surface gap-x-4 gap-y-6 grid grid-cols-1 md:grid-cols-2 p-6">
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

        <IftaLabel class="-mb-[5px] md:col-span-2">
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
        <h2 class="font-semibold mb-4 text-lg">
          {{ t('ptoj.connect_accounts') }}
        </h2>
        <div class="space-y-4">
          <p class="text-sm text-surface-600">
            {{ t('ptoj.connect_accounts_desc') }}
          </p>
          <div class="border border-surface flex gap-4 items-center justify-between p-4 rounded-lg">
            <div>
              <div class="font-medium">
                {{ t('ptoj.cjlu_sso') }}
              </div>
              <div class="text-sm text-surface-600">
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
        </div>
      </div>

      <div class="p-6">
        <h2 class="font-semibold mb-4 text-lg">
          {{ t('ptoj.change_password') }}
        </h2>
        <div class="space-y-4">
          <p class="text-sm text-surface-600">
            {{ t('ptoj.change_password_desc') }}
          </p>
          <Button :label="t('ptoj.change_password')" icon="pi pi-key" severity="warning" @click="openPasswordDialog" />
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
        <div class="flex gap-2 justify-end mt-6">
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
