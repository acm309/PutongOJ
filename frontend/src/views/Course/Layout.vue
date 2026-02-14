<script setup lang="ts">
import { courseRoleNone } from '@backend/utils/constants'
import { AxiosError } from 'axios'
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import IftaLabel from 'primevue/iftalabel'
import InputText from 'primevue/inputtext'
import { computed, onBeforeMount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api'
import { useRootStore } from '@/store'
import { useCourseStore } from '@/store/modules/course'
import { onProfileUpdate } from '@/utils/helper'
import { useMessage } from '@/utils/message'

const { t } = useI18n()
const message = useMessage()
const route = useRoute()
const router = useRouter()
const rootStore = useRootStore()
const courseStore = useCourseStore()
const { findCourse } = courseStore
const { course } = storeToRefs(courseStore)

const displayTab = computed(() => route.name as string || 'courseProblems')
const courseId = computed(() => Number.parseInt(route.params.id as string))
const courseLoaded = computed(() => course.value?.courseId === courseId.value)
const role = computed(() => {
  if (course.value?.courseId !== courseId.value) {
    return courseRoleNone
  }
  return course.value?.role ?? courseRoleNone
})

const joinModal = ref(false)
const joinForm = $ref({
  joinCode: '',
})
const joining = ref(false)

async function fetch () {
  await findCourse(courseId.value)
  if (courseLoaded.value && course.value) {
    const title = `${course.value.name} - ${t('oj.course')}`
    rootStore.changeDomTitle({ title })
  }
  if (
    !role.value.manageCourse
    && [ 'courseMembers', 'courseSettings' ].includes(displayTab.value)
  ) {
    router.push({ name: 'courseProblems', params: { id: courseId.value } })
  }
}

async function joinCourse () {
  if (!joinForm.joinCode) {
    message.warn(t('oj.form_invalid'))
    return
  }

  joining.value = true
  try {
    const result = await api.course.joinCourse(courseId.value, joinForm.joinCode)
    if (result.data?.success === true) {
      message.success(t('oj.course_join_success'))
      await findCourse(courseId.value)
    } else if (result instanceof AxiosError) {
      message.error(t('join_failed', { error: `Failed to join course: ${result.response?.data?.error || result.message}` }))
    } else {
      message.error(t('join_failed', { error: t('oj.unknown_error') }))
    }
    joinModal.value = false
  } catch (e: any) {
    message.error(t('join_failed', { error: e?.message || t('oj.unknown_error') }))
  } finally {
    joining.value = false
  }
}

onBeforeMount(fetch)
onProfileUpdate(fetch)
</script>

<template>
  <div v-if="!courseLoaded" class="max-w-6xl p-0">
    <div class="flex font-semibold gap-4 items-center pt-6 px-6">
      <i class="pi pi-book text-2xl" />
      <h1 class="text-xl">
        {{ t('oj.course') }}
      </h1>
    </div>
    <div class="flex gap-4 items-center justify-center px-6 py-24">
      <i class="pi pi-spin pi-spinner text-2xl" />
      <span>{{ t('ptoj.loading') }}</span>
    </div>
  </div>

  <RouterView v-else-if="role.basic" />

  <div v-else class="max-w-4xl">
    <div class="flex flex-col gap-6 items-center justify-center max-w-2xl mx-auto p-8 pb-25 sm:pb-8 text-center">
      <i class="pi pi-lock text-6xl text-muted-color" />
      <h2 class="font-semibold text-xl">
        {{ t('oj.course_private_explanation') }}
      </h2>
      <div class="flex gap-4">
        <Button v-if="course.canJoin" severity="primary" size="large" @click="joinModal = true">
          <i class="pi pi-user-plus" />
          {{ t('oj.course_join') }}
        </Button>
        <Button size="large" severity="secondary" outlined @click="() => router.go(-1)">
          {{ t('oj.go_back') }}
        </Button>
      </div>
    </div>

    <Dialog
      v-if="course.canJoin" v-model:visible="joinModal" modal :header="t('oj.course_join')"
      :style="{ width: '28rem' }" :closable="false"
    >
      <IftaLabel>
        <InputText
          id="joinCode" v-model="joinForm.joinCode" fluid
          :placeholder="t('oj.course_join_code_placeholder')"
        />
        <label for="joinCode">{{ t('oj.course_join_code') }}</label>
      </IftaLabel>

      <template #footer>
        <Button :label="t('oj.cancel')" severity="secondary" outlined :disabled="joining" @click="joinModal = false" />
        <Button :label="t('oj.confirm')" :loading="joining" @click="joinCourse" />
      </template>
    </Dialog>
  </div>
</template>
