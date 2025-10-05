<script lang="ts" setup>
import type { AdminUserDetailQueryResult, AdminUserEditPayload } from '@putongoj/shared'
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
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getUser, updateUser, updateUserPassword } from '@/api/admin'
import { useRootStore } from '@/store'
import { useSessionStore } from '@/store/modules/session'
import { privilegeOptions } from '@/utils/constant'
import { encryptData } from '@/utils/crypto'
import { getPrivilegeLabel, getPrivilegeSeverity, timePretty } from '@/utils/formate'
import { onRouteParamUpdate } from '@/utils/helper'
import { useMessage } from '@/utils/message'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const sessionStore = useSessionStore()
const { changeDomTitle } = useRootStore()
const { profile, isRoot } = storeToRefs(sessionStore)

const uid = computed(() => route.params.uid as string)
const user = ref<AdminUserDetailQueryResult | null>(null)
const editingUser = ref<AdminUserEditPayload>({})
const loading = ref(false)
const saving = ref(false)
const passwordDialog = ref(false)
const newPassword = ref('')
const confirmPassword = ref('')

const hasChanges = computed(() => {
  if (!user.value) return false
  return editingUser.value.privilege !== user.value.privilege
    || editingUser.value.nick !== user.value.nick
    || editingUser.value.motto !== user.value.motto
    || editingUser.value.mail !== user.value.mail
    || editingUser.value.school !== user.value.school
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
  }
}

async function fetch () {
  loading.value = true
  const resp = await getUser(uid.value)
  loading.value = false
  if (!resp.success) {
    message.error('Failed to load user', resp.message)
    router.back()
    return
  }

  user.value = resp.data
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

  if (Object.keys(payload).length === 0) {
    message.info('No changes detected', 'User information remains unchanged')
    return
  }

  saving.value = true
  const resp = await updateUser(uid.value, payload)
  saving.value = false

  if (!resp.success) {
    message.error('Failed to save changes', resp.message)
    return
  }

  message.success('User updated', 'User information has been saved successfully')
  user.value = resp.data
  setEditingUser()
}

async function changePassword () {
  if (!newPassword.value) {
    message.error('Password required', 'Please enter a new password')
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    message.error('Password mismatch', 'The passwords you entered do not match')
    return
  }
  if (/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(newPassword.value) === false) {
    message.error('Weak password', 'Password must be at least 8 characters long and include uppercase letters, lowercase letters, and numbers')
    return
  }

  saving.value = true
  const resp = await updateUserPassword(uid.value, {
    newPassword: await encryptData(newPassword.value),
  })
  saving.value = false
  if (!resp.success) {
    message.error('Password update failed', resp.message)
    return
  }

  message.success('Password updated', 'User password has been changed successfully')
  passwordDialog.value = false
}

function openPasswordDialog () {
  passwordDialog.value = true
  newPassword.value = ''
  confirmPassword.value = ''
}

onMounted(fetch)
onRouteParamUpdate(fetch)
</script>

<template>
  <div class="max-w-4xl p-0">
    <div class="flex font-semibold gap-4 items-center pt-6 px-6">
      <i class="pi pi-user-edit text-2xl" />
      <h1 class="text-xl">
        User Management
      </h1>
    </div>

    <template v-if="loading || !user">
      <div class="flex gap-4 items-center justify-center px-6 py-24">
        <i class="pi pi-spin pi-spinner text-2xl" />
        <span>{{ loading ? 'Loading user data...' : 'Failed to load user data' }}</span>
      </div>
    </template>

    <template v-else>
      <div class="border-b border-surface gap-x-4 gap-y-6 grid grid-cols-1 md:grid-cols-2 p-6">
        <Message v-if="!canOperate" class="md:col-span-2" severity="warn" variant="outlined" icon="pi pi-info-circle">
          You do not have permission to operate on this user because their privilege is not lower than yours.
        </Message>

        <IftaLabel>
          <InputText id="username" :value="user.uid" class="w-full" readonly />
          <label for="username">Username</label>
        </IftaLabel>

        <IftaLabel>
          <Select
            v-if="!isSelf && (user.privilege < profile!.privilege || isRoot)" id="privilege"
            v-model="editingUser.privilege" class="w-full" :options="privilegeOptions" option-label="label"
            option-value="value" :option-disabled="(option) => !isRoot && option.value >= profile!.privilege"
          >
            <template #option="slotProps">
              <Tag
                :value="getPrivilegeLabel(slotProps.option.value)"
                :severity="getPrivilegeSeverity(slotProps.option.value)"
              />
            </template>
          </Select>
          <IconField v-else>
            <InputText id="privilege" :value="getPrivilegeLabel(user.privilege)" class="w-full" readonly />
            <InputIcon class="pi pi-lock" />
          </IconField>
          <label for="privilege">Privilege</label>
        </IftaLabel>

        <IftaLabel>
          <InputText
            id="nickname" v-model="editingUser.nick" class="w-full" maxlength="30" placeholder="Enter nickname"
            :readonly="!canOperate"
          />
          <label for="nickname">Nickname</label>
        </IftaLabel>

        <IftaLabel>
          <InputText
            id="email" v-model="editingUser.mail" class="w-full" type="email" maxlength="254"
            placeholder="Enter email address" :readonly="!canOperate"
          />
          <label for="email">Email</label>
        </IftaLabel>

        <IftaLabel class="md:col-span-2">
          <InputText
            id="school" v-model="editingUser.school" class="w-full" maxlength="30" placeholder="Enter school"
            :readonly="!canOperate"
          />
          <label for="school">School</label>
        </IftaLabel>

        <IftaLabel class="-mb-[5px] md:col-span-2">
          <Textarea
            id="motto" v-model="editingUser.motto" class="w-full" rows="3" maxlength="300"
            placeholder="Enter motto" auto-resize :readonly="!canOperate"
          />
          <label for="motto">Motto</label>
        </IftaLabel>

        <div class="flex gap-2 justify-end md:col-span-2">
          <Button icon="pi pi-refresh" severity="secondary" outlined :loading="loading" @click="fetch" />
          <Button
            label="Save Changes" icon="pi pi-check" :loading="saving" :disabled="!canOperate || !hasChanges"
            @click="saveUser"
          />
        </div>
      </div>

      <div class="border-b border-surface p-6">
        <h2 class="font-semibold mb-4 text-lg">
          Password
        </h2>
        <div class="space-y-4">
          <p class="text-sm text-surface-600">
            Change the user's password. This will immediately invalidate the current password and all active sessions.
          </p>
          <Button
            label="Change Password" icon="pi pi-key" severity="warning" :disabled="!canOperate"
            @click="openPasswordDialog"
          />
        </div>
      </div>

      <div class="p-6">
        <h2 class="font-semibold mb-4 text-lg">
          Audit Information
        </h2>
        <div class="gap-4 grid grid-cols-1 md:grid-cols-2">
          <IftaLabel>
            <InputText id="created-at" :value="timePretty(user.createdAt)" class="font-mono w-full" readonly />
            <label for="created-at">Created At</label>
          </IftaLabel>
          <IftaLabel>
            <InputText
              id="last-visited" :value="user.lastVisitedAt ? timePretty(user.lastVisitedAt) : 'Unknown'"
              class="font-mono w-full" readonly
            />
            <label for="last-visited">Last Visited At</label>
          </IftaLabel>
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
