<script setup lang="ts">
import type { OAuthProvider } from '@putongoj/shared'
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { handleOAuthCallback } from '@/api/oauth'
import { useSessionStore } from '@/store/modules/session'
import { useMessage } from '@/utils/message'

const route = useRoute()
const router = useRouter()
const sessionStore = useSessionStore()
const message = useMessage()
const { fetchProfile, toggleAuthnDialog } = sessionStore

const code = computed(() => route.query.code as string || '')
const state = computed(() => route.query.state as string || '')
const provider = computed(() => route.params.provider as string || '')

async function processOAuthCallback () {
  if (!code.value || !state.value) {
    message.error('Invalid OAuth callback parameters.')
    router.replace({ name: 'home' })
    return
  }
  const data = await handleOAuthCallback(
    provider.value.toLowerCase() as Lowercase<OAuthProvider>,
    { code: code.value, state: state.value },
  )
  if (!data.success) {
    message.error(data.message || 'OAuth callback processing failed')
    toggleAuthnDialog()
    return
  }
  const { action } = data.data!
  if (action === 'connect') {
    message.success('OAuth account successfully connected!')
    router.replace({ name: 'AccountSettings' })
    return
  }
  if (action === 'login') {
    message.success('OAuth login successful!')
    await fetchProfile()
    router.replace({ name: 'home' })
  }
}

onMounted(() => {
  processOAuthCallback()
})
</script>

<template>
  <div class="bg-transparent border-none flex flex-col items-center justify-center min-h-200 px-4 shadow-none">
    <div class="max-w-md text-center w-full">
      <i class="mb-4 pi pi-key text-4xl text-primary" />
      <h1 class="font-bold mb-2 text-2xl">
        OAuth Processing...
      </h1>
      <p class="text-muted-color">
        We are processing your OAuth login. Please wait a moment...
      </p>
    </div>
  </div>
</template>
