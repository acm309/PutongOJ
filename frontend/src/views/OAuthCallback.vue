<script lang="ts" setup>
import type { OAuthProvider } from '@putongoj/shared'
import type { Message } from 'view-ui-plus'
import { storeToRefs } from 'pinia'
import { Alert } from 'view-ui-plus'
import { computed, inject, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { handleOAuthCallback } from '@/api/oauth'
import { useSessionStore } from '@/store/modules/session'

const route = useRoute()
const router = useRouter()
const sessionStore = useSessionStore()
const { fetchProfile, toggleAuthnDialog } = sessionStore
const { profile } = storeToRefs(sessionStore)
const message = inject('$Message') as typeof Message

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
    router.replace({ name: 'userEdit', params: { uid: profile.value!.uid } })
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
  <Alert show-icon class="oauth-info">
    OAuth Processing...
    <template #icon>
      <Icon type="ios-key-outline" />
    </template>
    <template #desc>
      We are processing your OAuth login. Please wait a moment...
    </template>
  </Alert>
</template>

<style lang="stylus" scoped>
.oauth-info
  padding 20px
  max-width 768px
</style>
