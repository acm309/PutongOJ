<script setup lang="ts">
import type { ContestCreatePayload } from '@putongoj/shared'
import Button from 'primevue/button'
import DatePicker from 'primevue/datepicker'
import Dialog from 'primevue/dialog'
import IftaLabel from 'primevue/iftalabel'
import InputText from 'primevue/inputtext'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { createContest } from '@/api/contest'
import { useMessage } from '@/utils/message'
import LabeledSwitch from './LabeledSwitch.vue'

const props = defineProps<{
  course?: number
}>()
const visible = defineModel<boolean>('visible')

const HOUR = 60 * 60 * 1000
const currentTime = Math.floor(new Date().getTime() / HOUR) * HOUR

const { t } = useI18n()
const router = useRouter()
const message = useMessage()

const submitting = ref(false)
const form = ref<ContestCreatePayload>({
  title: '',
  startsAt: new Date(currentTime + 1 * HOUR),
  endsAt: new Date(currentTime + 2 * HOUR),
  isHidden: true,
  isPublic: false,
})

async function submit () {
  submitting.value = true
  const resp = await createContest({
    ...form.value,
    course: props.course,
  })
  submitting.value = false

  if (!resp.success) {
    message.error(t('ptoj.failed_create_contest'), resp.message)
    return
  }

  const { contestId } = resp.data
  router.push({ name: 'ContestOverview', params: { contestId } })
}
</script>

<template>
  <Dialog
    v-model:visible="visible" modal :header="t('ptoj.create_contest')" :closable="false"
    class="max-w-md mx-6 w-full"
  >
    <form @submit.prevent="submit">
      <div class="space-y-4">
        <IftaLabel>
          <InputText id="title" v-model="form.title" required fluid />
          <label for="title">{{ t('ptoj.title') }}</label>
        </IftaLabel>
        <IftaLabel>
          <DatePicker
            v-model="form.startsAt" show-time show-seconds date-format="yy-mm-dd" time-format="HH:mm:ss"
            :step-second="15" fluid required
          />
          <label for="startsAt">{{ t('ptoj.starts_at') }}</label>
        </IftaLabel>

        <IftaLabel>
          <DatePicker
            v-model="form.endsAt" show-time show-seconds date-format="yy-mm-dd" time-format="HH:mm:ss"
            :step-second="15" fluid required
          />
          <label for="endsAt">{{ t('ptoj.ends_at') }}</label>
        </IftaLabel>

        <LabeledSwitch v-model="form.isHidden" :label="t('ptoj.hidden')" :description="t('ptoj.hide_from_listings')" />

        <LabeledSwitch v-model="form.isPublic" :label="t('ptoj.public')" :description="t('ptoj.anyone_can_join')" />
      </div>
      <div class="flex gap-2 justify-end mt-5">
        <Button
          type="button" :label="t('ptoj.cancel')" icon="pi pi-times" severity="secondary" outlined
          @click="visible = false"
        />
        <Button type="submit" :label="t('ptoj.create_contest')" icon="pi pi-check" :loading="submitting" />
      </div>
    </form>
  </Dialog>
</template>
