<script setup lang="ts">
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import IftaLabel from 'primevue/iftalabel'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import { useConfirm } from 'primevue/useconfirm'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/api'
import LabeledSwitch from '@/components/LabeledSwitch.vue'
import { useCourseStore } from '@/store/modules/course'
import { useSessionStore } from '@/store/modules/session'
import { useMessage } from '@/utils/message'

const { t } = useI18n()
const message = useMessage()
const confirm = useConfirm()
const sessionStore = useSessionStore()
const courseStore = useCourseStore()
const { isRoot } = storeToRefs(sessionStore)
const { course } = storeToRefs(courseStore)

const submitting = ref(false)

const isPublic = computed({
  get: () => course.value.encrypt === 1,
  set: (value: boolean) => {
    course.value.encrypt = value ? 1 : 2
  },
})

function validate () {
  if (!course.value.name) {
    message.warn(t('oj.course_name_required'))
    return false
  }
  if (course.value.name.length < 3) {
    message.warn(t('oj.course_name_min_length'))
    return false
  }
  if (course.value.description && course.value.description.length > 100) {
    message.warn(t('oj.description_max_length'))
    return false
  }
  if (course.value.joinCode && (course.value.joinCode.length < 6 || course.value.joinCode.length > 20)) {
    message.warn(t('oj.join_code_length'))
    return false
  }
  return true
}

async function updateCourse () {
  if (!validate()) {
    return
  }

  submitting.value = true
  try {
    await api.course.updateCourse(course.value.courseId, {
      name: course.value.name,
      description: course.value.description,
      encrypt: course.value.encrypt,
      joinCode: course.value.joinCode || '',
    })
    message.success(t('oj.course_updated_successfully'))
  } catch (e: any) {
    message.error(t('oj.failed_to_update_course', { error: e.message }))
  } finally {
    submitting.value = false
  }
}

function rearrangeProblems (event: any) {
  confirm.require({
    target: event.currentTarget,
    message: t('oj.confirm'),
    header: t('oj.confirm'),
    rejectProps: {
      label: t('oj.cancel'),
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: t('oj.ok'),
    },
    accept: () => {
      api.course.rearrangeProblems(course.value.courseId)
      message.info(t('oj.rearrange_task_dispatched'))
    },
  })
}
</script>

<template>
  <div class="max-w-4xl p-0">
    <div class="border-b border-surface gap-x-4 gap-y-6 grid grid-cols-1 md:grid-cols-2 p-6">
      <h2 class="-mb-1.75 font-semibold md:col-span-2 text-lg">
        {{ t('ptoj.basic_information') }}
      </h2>

      <IftaLabel class="md:col-span-2">
        <InputText id="name" v-model="course.name" fluid :maxlength="30" />
        <label for="name">{{ t('oj.name') }}</label>
      </IftaLabel>

      <IftaLabel class="md:col-span-2">
        <Textarea id="description" v-model="course.description" :maxlength="100" :rows="3" auto-resize fluid />
        <label for="description">{{ t('oj.description') }}</label>
      </IftaLabel>

      <div class="flex gap-3 justify-end md:col-span-2">
        <Button :label="t('ptoj.save_changes')" :loading="submitting" icon="pi pi-save" @click="updateCourse" />
      </div>
    </div>

    <div class="border-b border-surface gap-x-4 gap-y-6 grid grid-cols-1 md:grid-cols-2 p-6">
      <h2 class="-mb-1.75 font-semibold md:col-span-2 text-lg">
        {{ t('ptoj.access_control') }}
      </h2>

      <LabeledSwitch v-model="isPublic" :label="t('ptoj.public')" :description="t('ptoj.anyone_can_join')" />

      <IftaLabel>
        <InputText id="joinCode" v-model="course.joinCode" fluid :maxlength="20" :disabled="isPublic" />
        <label for="joinCode">{{ t('oj.join_code') }}</label>
      </IftaLabel>

      <div class="flex gap-3 justify-end md:col-span-2">
        <Button :label="t('ptoj.save_changes')" :loading="submitting" icon="pi pi-save" @click="updateCourse" />
      </div>
    </div>

    <div v-if="isRoot" class="gap-x-4 gap-y-6 grid grid-cols-1 md:grid-cols-2 p-6">
      <h2 class="-mb-1.75 font-semibold md:col-span-2 text-lg">
        {{ t('oj.system_action') }}
      </h2>

      <div class="flex items-center justify-between md:col-span-2">
        <span>{{ t('oj.problem_sort_rearrange') }}</span>
        <Button :label="t('oj.execute')" icon="pi pi-play" @click="rearrangeProblems" />
      </div>
    </div>
  </div>
</template>
