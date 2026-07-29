<script setup lang="ts">
import type { DiscussionCreatePayload } from '@putongoj/shared'
import { DiscussionType } from '@putongoj/shared'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import IftaLabel from 'primevue/iftalabel'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { createDiscussion } from '@/api/discussion'
import DiscussionTypeTag from '@/components/DiscussionTypeTag.vue'
import { useMessage } from '@/utils/message'

const props = withDefaults(defineProps<{
  contest?: number
  problemOptions?: Array<{
    label: string
    value: number
  }>
  problem?: number
  isManaged?: boolean
}>(), {
  contest: undefined,
  problemOptions: undefined,
  problem: undefined,
  isManaged: false,
})
const visible = defineModel<boolean>('visible')

const { t } = useI18n()
const router = useRouter()
const message = useMessage()
const creating = ref(false)
const createForm = ref({
  type: DiscussionType.PrivateClarification,
  title: '',
  content: '',
} as DiscussionCreatePayload)
const problem = ref<number | undefined | null>()

const hasEntered = computed(() => {
  return Boolean(createForm.value.title.trim()) && Boolean(createForm.value.content.trim())
})

const discussionTypeOptions = computed(() => [ {
  value: DiscussionType.PrivateClarification,
  label: t('ptoj.clarification'),
  desc: t('ptoj.clarification_type_desc'),
  disabled: false,
}, {
  value: DiscussionType.PublicAnnouncement,
  label: t('ptoj.announcement'),
  desc: t('ptoj.announcement_type_desc'),
  disabled: !props.isManaged,
}, {
  value: DiscussionType.OpenDiscussion,
  label: t('ptoj.discussion'),
  desc: t('ptoj.discussion_type_desc'),
  disabled: !props.isManaged,
} ])

async function submitDiscussion () {
  const payload = { ...createForm.value }
  if (typeof props.contest === 'number') {
    payload.contest = props.contest
    if (typeof problem.value === 'number') {
      payload.problem = problem.value
    }
  } else {
    if (typeof props.problem === 'number') {
      payload.problem = props.problem
    }
  }

  creating.value = true
  const resp = await createDiscussion(payload)
  creating.value = false

  if (!resp.success) {
    message.error(t('ptoj.failed_create_discussion'), resp.message)
    return
  }

  const { discussionId } = resp.data
  message.success(
    t('ptoj.successful_create_discussion'),
    t('ptoj.successful_create_discussion_detail', { discussionId }),
  )
  router.push({ name: 'DiscussionDetail', params: { discussionId } })
}
</script>

<template>
  <Dialog
    v-model:visible="visible" :header="t('ptoj.create_discussion')" modal :closable="false"
    class="max-w-3xl mx-6 w-full"
  >
    <form @submit.prevent="submitDiscussion">
      <div class="space-y-4">
        <IftaLabel>
          <Select
            id="type" v-model="createForm.type" fluid :options="discussionTypeOptions" option-label="label"
            option-value="value" :option-disabled="(option) => option.disabled" required
          >
            <template #option="{ option }">
              <div class="flex gap-2 items-center">
                <DiscussionTypeTag :type="option.value" />
                <span class="text-sm">{{ option.desc }}</span>
              </div>
            </template>
          </Select>
          <label for="type">{{ t('ptoj.type') }}</label>
        </IftaLabel>
        <IftaLabel v-if="typeof contest === 'number'">
          <Select
            v-model="problem" fluid :options="problemOptions" option-label="label" option-value="value" show-clear
            :placeholder="t('ptoj.select_problem_optional')"
          >
            <template #dropdownicon>
              <i class="pi pi-flag" />
            </template>
          </Select>
          <label for="problem">{{ t('ptoj.problem') }}</label>
        </IftaLabel>
        <IftaLabel>
          <InputText
            id="title" v-model="createForm.title" fluid :placeholder="t('ptoj.enter_title')" maxlength="80"
            required
          />
          <label for="title">{{ t('ptoj.title') }}</label>
        </IftaLabel>
        <IftaLabel>
          <Textarea
            id="content" v-model="createForm.content" :placeholder="t('ptoj.enter_content')" required fluid
            rows="7" auto-resize
          />
          <label for="content">{{ t('ptoj.content') }}</label>
        </IftaLabel>
      </div>
      <div class="flex gap-2 justify-end mt-5">
        <Button
          type="button" :label="t('ptoj.cancel')" icon="pi pi-times" severity="secondary" outlined
          @click="visible = false"
        />
        <Button
          type="submit" :label="t('ptoj.submit_discussion')" icon="pi pi-send" :disabled="!hasEntered"
          :loading="creating"
        />
      </div>
    </form>
  </Dialog>
</template>
