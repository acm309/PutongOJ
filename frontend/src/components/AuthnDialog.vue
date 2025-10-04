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
import { useRoute, useRouter } from 'vue-router'
import { userLogin, userRegister } from '@/api/account'
import { generateOAuthUrl } from '@/api/oauth'
import { useRootStore } from '@/store'
import { useSessionStore } from '@/store/modules/session'
import { encryptData } from '@/utils/crypto'
import { useMessage } from '@/utils/message'

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
  const isRegister = !isLogin.value

  if (!username.trim()) {
    fieldValidity.value.username = false
    message.error('Username Required', 'Please enter your username')
    isValid = false
  } else if (isRegister) {
    if (username.length < 3 || username.length > 20) {
      fieldValidity.value.username = false
      message.error('Invalid Username', 'Username must be between 3 and 20 characters')
      isValid = false
    } else if (!/^[\w-]+$/.test(username)) {
      fieldValidity.value.username = false
      message.error('Invalid Username', 'Username can only contain letters, numbers, underscores and hyphens')
      isValid = false
    }
  }

  if (!password) {
    fieldValidity.value.password = false
    message.error('Password Required', 'Please enter your password')
    isValid = false
  } else if (isRegister) {
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
      fieldValidity.value.password = false
      message.error('Weak Password', 'Password must be at least 8 characters with uppercase, lowercase and numbers')
      isValid = false
    }
  }

  if (isRegister) {
    if (!confirmPassword) {
      fieldValidity.value.confirmPassword = false
      message.error('Confirmation Required', 'Please confirm your password')
      isValid = false
    } else if (password !== confirmPassword) {
      fieldValidity.value.confirmPassword = false
      message.error('Password Mismatch', 'Passwords do not match')
      isValid = false
    }
  }

  return isValid
}

function handleAuthError (result: ErrorEnveloped) {
  switch (result.code) {
    case ErrorCode.Unauthorized:
      message.error('Login Failed', 'Invalid username or password')
      break
    case ErrorCode.Forbidden:
      message.error('Account Suspended', 'Your account has been suspended')
      break
    case ErrorCode.Conflict:
      message.error('Registration Failed', 'Username already taken')
      break
    case ErrorCode.BadRequest:
      message.error('Invalid Password', 'Password does not meet requirements')
      break
    default:
      message.error('Authentication Error', result.message || 'An unexpected error occurred')
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

        message.success('Login Successful', `Welcome back, ${uid}!`)
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
        message.success('Registration Successful', 'Your account has been created successfully')
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
    v-model:visible="authnDialogVisible" modal :closable="true" :close-on-escape="true" class="max-w-md mx-6 w-full"
    @hide="closeModal"
  >
    <template #header>
      <div class="font-semibold pl-[35px] text-center text-xl w-full">
        {{ isLogin ? 'Login' : 'Register' }}
      </div>
    </template>

    <div v-if="hasOAuthEnabled && isLogin">
      <Button v-if="website.oauthEnabled.CJLU" severity="secondary" size="large" outlined class="w-full" @click="handleOAuthLogin('cjlu')">
        China Jiliang University SSO
      </Button>
      <Divider align="center">
        <b>OR</b>
      </Divider>
    </div>

    <form class="space-y-4" @submit.prevent="handleAuthSubmit">
      <IftaLabel>
        <InputText
          id="username" v-model="formData.username" class="w-full" :invalid="!fieldValidity.username"
          :placeholder="isLogin ? 'Enter your username' : 'Choose a username (3-20 characters)'"
          autocomplete="username" size="large"
        />
        <label for="username">Username</label>
      </IftaLabel>

      <IftaLabel>
        <InputText
          id="password" v-model="formData.password" type="password" class="w-full"
          :invalid="!fieldValidity.password"
          :placeholder="isLogin ? 'Enter your password' : 'Create a strong password'"
          :autocomplete="isLogin ? 'current-password' : 'new-password'" size="large"
        />
        <label for="password">Password</label>
      </IftaLabel>

      <IftaLabel v-if="!isLogin">
        <InputText
          id="confirm-password" v-model="formData.confirmPassword" type="password" class="w-full"
          :invalid="!fieldValidity.confirmPassword" placeholder="Confirm your password"
          autocomplete="new-password" size="large"
        />
        <label for="confirm-password">Confirm Password</label>
      </IftaLabel>

      <Button
        type="submit" :label="isLogin ? 'Login' : 'Register'" size="large"
        :icon="isLogin ? 'pi pi-sign-in' : 'pi pi-user-plus'" class="w-full" :loading="loading"
      />

      <Button
        type="button" :label="isLogin ? 'Go to Register' : 'Back to Login'" size="large" outlined
        :icon="isLogin ? 'pi pi-user-plus' : 'pi pi-sign-in'" severity="secondary" class="w-full" :disabled="loading"
        @click="switchTab(isLogin ? AuthnDialogTab.REGISTER : AuthnDialogTab.LOGIN)"
      />
    </form>
  </Dialog>
</template>
