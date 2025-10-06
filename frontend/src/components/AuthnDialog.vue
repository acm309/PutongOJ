<script lang="ts" setup>
import type {
  ErrorEnveloped,
  OAuthAction,
  OAuthProvider,
} from '@putongoj/shared'
import { ErrorCode } from '@putongoj/shared'
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Divider from 'primevue/divider'
import IftaLabel from 'primevue/iftalabel'
import InputText from 'primevue/inputtext'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { userLogin, userRegister } from '@/api/account'
import { generateOAuthUrl } from '@/api/oauth'
import { useRootStore } from '@/store'
import { useSessionStore } from '@/store/modules/session'
import { encryptData } from '@/utils/crypto'
import { useMessage } from '@/utils/message'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const message = useMessage()
const rootStore = useRootStore()
const sessionStore = useSessionStore()

const { website } = storeToRefs(rootStore)
const { authnDialog } = storeToRefs(sessionStore)

enum AuthnDialogTab {
  LOGIN = 'login',
  REGISTER = 'register',
}

const loading = ref(false)
const currentTab = ref(AuthnDialogTab.LOGIN)
const authnDialogVisible = ref(false)

const isLogin = computed(() => currentTab.value === AuthnDialogTab.LOGIN)
const hasOAuthEnabled = computed(() => Object.values(website.value.oauthEnabled).includes(true))

const formData = ref({
  username: '',
  password: '',
  confirmPassword: '',
})
const fieldValidity = ref({
  username: true,
  password: true,
  confirmPassword: true,
})

function resetValidity () {
  fieldValidity.value = { username: true, password: true, confirmPassword: true }
}

function validateForm (): boolean {
  resetValidity()
  let isValid = true
  const { username, password, confirmPassword } = formData.value

  if (!isLogin.value) {
    if (!/^[\w-]{3,20}$/.test(username)) {
      fieldValidity.value.username = false
      message.error(t('ptoj.username_invalid'), t('ptoj.username_invalid_detail'))
      isValid = false
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
      fieldValidity.value.password = false
      message.error(t('ptoj.password_weak'), t('ptoj.password_weak_detail'))
      isValid = false
    }
    if (password !== confirmPassword) {
      fieldValidity.value.confirmPassword = false
      message.error(t('ptoj.password_mismatch'), t('ptoj.password_mismatch_detail'))
      isValid = false
    }
  }

  return isValid
}

function handleAuthError (result: ErrorEnveloped) {
  switch (result.code) {
    case ErrorCode.Unauthorized:
      message.error(t('ptoj.failed_login'), t('ptoj.incorrect_username_or_password'))
      break
    case ErrorCode.Forbidden:
      message.error(t('ptoj.failed_login'), t('ptoj.account_banned_detail'))
      break
    case ErrorCode.Conflict:
      message.error(t('ptoj.failed_register'), t('ptoj.username_already_taken'))
      break
    default:
      message.error(t('ptoj.failed_proceed'), result.message || t('ptoj.unexpected_error_occurred'))
      break
  }
}

async function handleAuthSubmit () {
  if (!validateForm()) {
    return
  }

  loading.value = true
  try {
    const { username, password } = formData.value
    const encryptedPassword = await encryptData(password)

    if (currentTab.value === AuthnDialogTab.LOGIN) {
      const result = await userLogin({
        username,
        password: encryptedPassword,
      })

      if (result.success) {
        const { uid } = result.data

        message.success(t('ptoj.successful_login'), t('ptoj.welcome_back', { username: uid }))
        sessionStore.setProfile(result.data)
        closeModal()

        if (route.name === 'oauthCallback') {
          router.push({ name: 'userEdit', params: { uid } })
        }
      } else {
        handleAuthError(result)
      }
    } else {
      const result = await userRegister({
        username,
        password: encryptedPassword,
      })

      if (result.success) {
        message.success(t('ptoj.successful_register'), t('ptoj.successful_register_detail'))
        sessionStore.setProfile(result.data)
        closeModal()
      } else {
        handleAuthError(result)
      }
    }
  } finally {
    loading.value = false
  }
}

function switchTab (newTab: AuthnDialogTab) {
  currentTab.value = newTab
  resetValidity()
  formData.value.password = ''
  formData.value.confirmPassword = ''
}

function resetForm () {
  formData.value = { username: '', password: '', confirmPassword: '' }
  resetValidity()
}

function closeModal () {
  resetForm()
  authnDialogVisible.value = false
}

async function handleOAuthLogin (provider: Lowercase<OAuthProvider>) {
  const url = await generateOAuthUrl(provider, { action: 'login' as OAuthAction })
  window.open(url.url, '_self', 'noopener,noreferrer')
}

watch(authnDialog, (newValue) => {
  authnDialogVisible.value = newValue
})
watch(authnDialogVisible, (newValue) => {
  if (newValue !== authnDialog.value) {
    sessionStore.toggleAuthnDialog()
  }
})
</script>

<template>
  <Dialog
    v-model:visible="authnDialogVisible" modal :closable="true" :close-on-escape="true"
    class="max-w-md mx-6 w-full" @hide="closeModal"
  >
    <template #header>
      <div class="font-semibold pl-[35px] text-center text-xl w-full">
        {{ isLogin ? t('ptoj.login') : t('ptoj.register') }}
      </div>
    </template>

    <div v-if="hasOAuthEnabled && isLogin">
      <Button
        v-if="website.oauthEnabled.CJLU" severity="secondary" size="large" outlined class="w-full"
        @click="handleOAuthLogin('cjlu')"
      >
        {{ t('ptoj.cjlu_sso') }}
      </Button>
      <Divider align="center">
        <b>{{ t('ptoj.or') }}</b>
      </Divider>
    </div>

    <form class="space-y-4" @submit.prevent="handleAuthSubmit">
      <IftaLabel>
        <InputText
          id="username" v-model="formData.username" class="w-full" :invalid="!fieldValidity.username"
          :placeholder="isLogin ? t('ptoj.enter_username') : t('ptoj.choose_username')" autocomplete="username"
          size="large" required
        />
        <label for="username">{{ t('ptoj.username') }}</label>
      </IftaLabel>

      <IftaLabel>
        <InputText
          id="password" v-model="formData.password" type="password" class="w-full"
          :invalid="!fieldValidity.password" :placeholder="isLogin ? t('ptoj.enter_password') : t('ptoj.create_strong_password')"
          :autocomplete="isLogin ? 'current-password' : 'new-password'" size="large" required
        />
        <label for="password">{{ t('ptoj.password') }}</label>
      </IftaLabel>

      <IftaLabel v-if="!isLogin">
        <InputText
          id="confirm-password" v-model="formData.confirmPassword" type="password" class="w-full"
          :invalid="!fieldValidity.confirmPassword" :placeholder="t('ptoj.enter_confirm_password')" autocomplete="new-password"
          size="large" required
        />
        <label for="confirm-password">{{ t('ptoj.confirm_password') }}</label>
      </IftaLabel>

      <Button
        type="submit" :label="isLogin ? t('ptoj.login') : t('ptoj.register')" size="large"
        :icon="isLogin ? 'pi pi-sign-in' : 'pi pi-user-plus'" class="w-full" :loading="loading"
      />

      <Button
        type="button" :label="isLogin ? t('ptoj.go_to_register') : t('ptoj.back_to_login')" size="large" outlined
        :icon="isLogin ? 'pi pi-user-plus' : 'pi pi-sign-in'" severity="secondary" class="w-full" :disabled="loading"
        @click="switchTab(isLogin ? AuthnDialogTab.REGISTER : AuthnDialogTab.LOGIN)"
      />
    </form>
  </Dialog>
</template>
