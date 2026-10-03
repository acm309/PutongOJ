<script setup lang="ts">
import type { AdminNotificationCreatePayload, Enveloped, NotificationSeverity } from '@putong-oj/shared'
import Button from 'primevue/button'
import IftaLabel from 'primevue/iftalabel'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import { useConfirm } from 'primevue/useconfirm'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { sendNotificationBroadcast, sendNotificationUser } from '@/api/admin'
import LabeledSwitch from '@/components/LabeledSwitch.vue'
import PageHeader from '@/components/PageHeader.vue'
import UserSelect from '@/components/UserSelect.vue'
import { useMessage } from '@/utils/message'

const defaultDuration = 10
const durationChoices = [ 5, 10, 20, 30 ]

const { t } = useI18n()
const message = useMessage()
const confirm = useConfirm()

const selectedDispatchMethod = ref('broadcast')
const targetUser = ref('')
const notification = ref<AdminNotificationCreatePayload>({
  title: '',
  content: '',
  severity: 'info',
  duration: defaultDuration,
})
const sending = ref(false)

// Remember the last auto-dismiss duration so toggling the switch back on restores it.
const lastDuration = ref(defaultDuration)
watch(() => notification.value.duration, (value) => {
  if (value !== null) {
    lastDuration.value = value
  }
})

const dispatchMethods = computed(() => [
  { label: t('ptoj.broadcast'), value: 'broadcast' },
  { label: t('ptoj.user_specific'), value: 'user' },
])
const severityOptions = computed<{ label: string, value: NotificationSeverity }[]>(() => [
  { label: t('ptoj.severity_info'), value: 'info' },
  { label: t('ptoj.severity_success'), value: 'success' },
  { label: t('ptoj.severity_warning'), value: 'warn' },
  { label: t('ptoj.severity_error'), value: 'error' },
])
const durationOptions = computed<{ label: string, value: number }[]>(() => durationChoices.map(seconds => ({
  label: t('ptoj.duration_seconds', { seconds }),
  value: seconds,
})))

const autoDismiss = computed({
  get: () => notification.value.duration !== null,
  set: (value: boolean) => {
    notification.value.duration = value ? lastDuration.value : null
  },
})
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
    return
  }

  message.success(t('ptoj.successful_send_notification'), notification.value.title)
  notification.value = {
    title: '',
    content: '',
    severity: 'info',
    duration: defaultDuration,
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
  <div class="max-w-4xl p-0">
    <PageHeader icon="pi pi-send" :title="t('ptoj.create_notification')" />

    <div class="gap-x-4 gap-y-6 grid grid-cols-1 md:grid-cols-2 p-6 pt-0">
      <IftaLabel :class="{ 'md:col-span-2': selectedDispatchMethod === 'broadcast' }">
        <Select
          id="method" v-model="selectedDispatchMethod" option-label="label" option-value="value"
          :options="dispatchMethods" fluid
        />
        <label for="method">{{ t('ptoj.dispatch_method') }}</label>
      </IftaLabel>

      <UserSelect v-if="selectedDispatchMethod === 'user'" v-model="targetUser" :label="t('ptoj.target_user')" />

      <IftaLabel>
        <InputText id="title" v-model="notification.title" :placeholder="t('ptoj.enter_title')" fluid :maxlength="30" />
        <label for="title">{{ t('ptoj.title') }}</label>
      </IftaLabel>

      <IftaLabel>
        <Select
          id="severity" v-model="notification.severity" option-label="label" option-value="value"
          :options="severityOptions" fluid
        />
        <label for="severity">{{ t('ptoj.severity') }}</label>
      </IftaLabel>

      <IftaLabel class="-mb-1.5 md:col-span-2">
        <Textarea
          id="content" v-model="notification.content" :placeholder="t('ptoj.enter_content')" rows="6" fluid
          :maxlength="300"
        />
        <label for="content">{{ t('ptoj.content') }}</label>
      </IftaLabel>

      <LabeledSwitch
        v-model="autoDismiss" :label="t('ptoj.auto_dismiss')"
        :description="t('ptoj.auto_dismiss_desc')"
      />

      <IftaLabel>
        <Select
          id="duration" v-model="notification.duration" option-label="label" option-value="value"
          :options="durationOptions" :disabled="!autoDismiss" fluid
        />
        <label for="duration">{{ t('ptoj.auto_dismiss_after') }}</label>
      </IftaLabel>

      <Button
        :label="t('ptoj.send_notification')" icon="pi pi-send" class="md:col-span-2" :loading="sending"
        :disabled="!formValid" @click="onSendNotification"
      />
    </div>
  </div>
</template>
