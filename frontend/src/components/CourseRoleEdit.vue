<script setup lang="ts">
import type { CourseRole } from '@backend/types'
import { UserPrivilege } from '@putongoj/shared'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'
import { computed, onBeforeMount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/api'
import UserSelect from '@/components/UserSelect.vue'
import { courseRoleFields } from '@/utils/constant'
import { useMessage } from '@/utils/message'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  courseId: {
    type: Number,
    required: true,
  },
  userId: {
    type: String,
    default: '',
  },
})
const emit = defineEmits([ 'update:modelValue' ])

const { t } = useI18n()
const message = useMessage()

const roleConfig = computed(() => ({
  basic: t('oj.course_basic_view'),
  viewTestcase: t('oj.course_view_testcase'),
  viewSolution: t('oj.course_view_solution'),
  manageProblem: t('oj.course_manage_problem'),
  manageContest: t('oj.course_manage_contest'),
  manageCourse: t('oj.course_manage_course'),
}))

const defaultRole = () => Object.fromEntries(courseRoleFields.map(field => [ field, false ])) as unknown as CourseRole

const modal = ref(false)
const loading = ref(false)
const selectedUserId = ref('')
const loaded = ref(false)
const isAdmin = ref(false)
const role = ref(defaultRole())
const disabled = ref(defaultRole())
const isEdit = computed(() => !!props.userId)
const courseId = computed(() => props.courseId)

watch(() => props.modelValue, val => modal.value = val)

function close () {
  modal.value = false
  emit('update:modelValue', false)
}

function rippleRoles () {
  let { basic, viewTestcase, viewSolution, manageProblem, manageContest, manageCourse } = role.value

  basic = true
  manageContest ||= manageCourse
  manageProblem ||= manageCourse
  viewSolution ||= manageCourse
  viewTestcase ||= manageProblem || manageCourse

  Object.assign(role.value, { basic, viewTestcase, viewSolution, manageProblem, manageContest, manageCourse })
  Object.assign(disabled.value, {
    basic: true,
    viewTestcase: manageProblem || manageCourse,
    viewSolution: manageCourse,
    manageProblem: manageCourse,
    manageContest: manageCourse,
    manageCourse: false,
  })
}

async function submit () {
  if (!selectedUserId.value) return
  loading.value = true
  try {
    await api.course.updateMember(courseId.value, selectedUserId.value, role.value)
    message.success(t('oj.course_member_update_success'))
    close()
  } finally {
    loading.value = false
  }
}

async function loadUser () {
  if (!selectedUserId.value) {
    return
  }
  loading.value = true
  try {
    const { data: member } = await api.course.getMember(courseId.value, selectedUserId.value)
    isAdmin.value = member.user.privilege >= UserPrivilege.Admin
    loaded.value = true
    Object.assign(role.value, member.role)
    rippleRoles()
  } finally {
    loading.value = false
  }
}

async function initModal () {
  isAdmin.value = false
  if (isEdit.value) {
    selectedUserId.value = props.userId
    await loadUser()
  } else {
    selectedUserId.value = ''
    loaded.value = false
    Object.assign(role.value, defaultRole())
    rippleRoles()
  }
}

watch(() => props.userId, initModal)
onBeforeMount(initModal)
</script>

<template>
  <Dialog
    v-model:visible="modal" modal :header="isEdit ? 'Edit Course Member' : 'Add Course Member'"
    :style="{ width: '32rem' }" :closable="false"
  >
    <div class="flex flex-col gap-4 relative" :class="{ 'opacity-50 pointer-events-none': loading }">
      <div class="flex flex-col gap-2">
        <UserSelect v-model="selectedUserId" :disabled="isEdit" :label="t('oj.course_user')" @select="loadUser" />
        <Message v-if="!loaded" severity="info" :closable="false">
          {{ t('oj.course_select_user_to_load') }}
        </Message>
        <Message v-if="isAdmin" severity="warn" :closable="false">
          {{ t('oj.course_admin_override') }}
        </Message>
      </div>

      <div class="flex flex-col gap-2">
        <label class="font-semibold">Role</label>
        <div class="flex flex-col gap-3">
          <div v-for="(label, field) in roleConfig" :key="field" class="flex gap-2 items-center">
            <Checkbox
              v-model="role[field]" :input-id="`role-${field}`" binary :disabled="!loaded || disabled[field]"
              @change="rippleRoles"
            />
            <label :for="`role-${field}`" class="cursor-pointer">{{ label }}</label>
          </div>
        </div>
      </div>

      <div v-if="loading" class="absolute bg-surface flex inset-0 items-center justify-center opacity-50 rounded">
        <i class="pi pi-spin pi-spinner text-2xl" />
      </div>
    </div>

    <template #footer>
      <Button :label="t('oj.cancel')" severity="secondary" outlined @click="close" />
      <Button :label="t('oj.confirm')" :disabled="loading" @click="submit" />
    </template>
  </Dialog>
</template>
