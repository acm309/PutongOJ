<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from '@/store/modules/session'
import { useUserStore } from '@/store/modules/user'

const router = useRouter()
const userStore = useUserStore()
const sessionStore = useSessionStore()

const { user } = storeToRefs(userStore)
const { isAdmin } = storeToRefs(sessionStore)

onMounted(async () => {
  if (isAdmin.value) {
    router.replace({ name: 'UserManagementDetail', params: { uid: (user.value as any).uid } })
  } else {
    router.replace({ name: 'AccountSettings' })
  }
})
</script>

<template>
  <div />
</template>
