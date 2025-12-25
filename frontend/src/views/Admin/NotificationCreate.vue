<script setup lang="ts">
import type { AdminNotificationCreatePayload, Enveloped } from '@putongoj/shared'
import Button from 'primevue/button'
import IftaLabel from 'primevue/iftalabel'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import { useConfirm } from 'primevue/useconfirm'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { sendNotificationBroadcast, sendNotificationUser } from '@/api/admin'
import UserSelect from '@/components/UserSelect.vue'
import { useMessage } from '@/utils/message'

const { t } = useI18n()
const message = useMessage()
const confirm = useConfirm()

const selectedDispatchMethod = ref('broadcast')
const targetUser = ref('')
const notification = ref({
  title: '',
  content: '',
} as AdminNotificationCreatePayload)
const sending = ref(false)

const dispatchMethods = computed(() => [
  { label: t('ptoj.broadcast'), value: 'broadcast' },
  { label: t('ptoj.user_specific'), value: 'user' },
])
const formValid = computed(() => {
  if (notification.value.title.trim() === '' || notification.value.content.trim() === '') {
    return false
  }
  if (selectedDispatchMethod.value === 'user' && targetUser.value.trim() === '') {
    return false
  }
  return true
})

async function sendNotification () {
  if (sending.value) {
    return
  }

  sending.value = true
  let resp: Enveloped<null> | null = null
  if (selectedDispatchMethod.value === 'broadcast') {
    resp = await sendNotificationBroadcast(notification.value)
  } else {
    resp = await sendNotificationUser(targetUser.value, notification.value)
  }
  sending.value = false
  if (!resp.success) {
    message.error(t('ptoj.failed_send_notification'), resp.message)
    return
  }

  message.success(t('ptoj.successful_send_notification'), notification.value.title)
  notification.value = {
    title: '',
    content: '',
  }
  targetUser.value = ''
}

function onSendNotification (event: Event) {
  confirm.require({
    target: event.currentTarget as HTMLElement,
    message: t('ptoj.proceed_confirm_message'),
    rejectProps: {
      label: t('ptoj.cancel'),
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: t('ptoj.send'),
      severity: 'primary',
    },
    accept: () => {
      sendNotification()
    },
  })
}
</script>

<template>
  <div class="max-w-4xl p-6">
    <div class="flex font-semibold gap-4 items-center mb-4">
      <i class="pi pi-send text-2xl" />
      <h1 class="text-xl">
        {{ t('ptoj.create_notification') }}
      </h1>
    </div>
    <div class="gap-4 grid grid-cols-1 md:grid-cols-2">
      <IftaLabel :class="{ 'md:col-span-2': selectedDispatchMethod === 'broadcast' }">
        <Select
          id="method" v-model="selectedDispatchMethod" option-label="label" option-value="value"
          :options="dispatchMethods" fluid
        />
        <label for="method">{{ t('ptoj.dispatch_method') }}</label>
      </IftaLabel>

      <UserSelect v-if="selectedDispatchMethod === 'user'" v-model="targetUser" :label="t('ptoj.target_user')" />

      <IftaLabel class="md:col-span-2">
        <InputText id="title" v-model="notification.title" :placeholder="t('ptoj.enter_title')" fluid :maxlength="30" />
        <label for="title">{{ t('ptoj.title') }}</label>
      </IftaLabel>

      <IftaLabel class="md:col-span-2">
        <Textarea
          id="content" v-model="notification.content" :placeholder="t('ptoj.enter_content')" rows="6" fluid
          :maxlength="300"
        />
        <label for="content">{{ t('ptoj.content') }}</label>
      </IftaLabel>

      <Button
        :label="t('ptoj.send_notification')" icon="pi pi-send" class="md:col-span-2" :loading="sending"
        :disabled="!formValid" @click="onSendNotification"
      />
    </div>
  </div>
</template>
