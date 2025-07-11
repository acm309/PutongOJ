<script lang="ts" setup>
import type { CourseRole } from '@backend/types'
import type { Message } from 'view-ui-plus'
import type { User } from '@/types'
import debounce from 'lodash.debounce'
import { Alert, Checkbox, Form, FormItem, Modal, Option, Select, Spin } from 'view-ui-plus'
import { computed, inject, onBeforeMount, ref, watch } from 'vue'
import api from '@/api'
import { courseRoleFields, privilege } from '@/util/constant'

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
const message = inject('$Message') as typeof Message

const roleConfig = {
  basic: 'Basic View',
  viewTestcase: 'View Testcase',
  viewSolution: 'View Solution',
  manageProblem: 'Manage Problem',
  manageContest: 'Manage Contest',
  manageCourse: 'Manage Course',
} as const

const defaultRole = () => Object.fromEntries(courseRoleFields.map(field => [ field, false ])) as unknown as CourseRole

const modal = ref(false)
const loading = ref(false)
const loadingUsers = ref(false)
const userId = ref('')
const loaded = ref(false)
const isAdmin = ref(false)
const role = ref(defaultRole())
const disabled = ref(defaultRole())
const users = ref([] as { value: string, label: string }[])
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

function userToSelection (user: Pick<User, 'uid' | 'nick'>): { value: string, label: string } {
  return {
    value: user.uid,
    label: user.uid + (user.nick ? ` (${user.nick})` : ''),
  }
}

const fetchUsers = debounce(async (query: string) => {
  if (query.length === 0) {
    users.value = []
    return
  }
  loadingUsers.value = true
  try {
    const { data: found } = await api.user.find({ type: 'name', content: query, page: 1, pageSize: 30 })
    users.value = found.docs.map(userToSelection)
  } finally {
    loadingUsers.value = false
  }
}, 500)

async function submit () {
  loading.value = true
  try {
    await api.course.updateMember(courseId.value, userId.value, role.value)
    message.success('Update member successfully')
    close()
  } finally {
    loading.value = false
  }
}

async function loadUser (loadUserId: string) {
  if (typeof loadUserId !== 'string' || loadUserId.length === 0) {
    return
  }
  loading.value = true
  try {
    const { data: member } = await api.course.getMember(courseId.value, loadUserId)
    users.value = [ userToSelection(member.user) ]
    userId.value = loadUserId
    isAdmin.value = member.user.privilege > privilege.User
    loaded.value = true
    Object.assign(role.value, member.role)
    rippleRoles()
  } finally {
    loading.value = false
  }
}

async function initModal () {
  if (isEdit.value) {
    loadUser(props.userId)
  } else {
    userId.value = ''
    loaded.value = false
    Object.assign(role.value, defaultRole())
    rippleRoles()
  }
}

watch(() => props.userId, initModal)
onBeforeMount(initModal)
</script>

<template>
  <Modal v-model="modal" :loading="true" :title="`${isEdit ? 'Edit' : 'Add'} Course Member`" :closable="false" @on-cancel="close" @on-ok="submit">
    <Form class="role-form" :label-width="80">
      <FormItem label="User">
        <Select v-model="userId" :disabled="isEdit" filterable :remote-method="fetchUsers" :loading="loadingUsers" @on-change="value => loadUser(value)">
          <Option v-for="user in users" :key="user.value" :value="user.value" :label="user.label" />
        </Select>
        <Alert v-if="!loaded" class="role-alert">
          Type something to search, select a user first.
        </Alert>
        <Alert v-if="isAdmin" class="role-alert" type="warning">
          This user is an admin, will not limited by the course role setting here.
        </Alert>
      </FormItem>
      <FormItem label="Role">
        <Checkbox
          v-for="(label, field) in roleConfig" :key="field" v-model="role[field]" class="role-checkbox"
          :disabled="!loaded || disabled[field]" border @on-change="rippleRoles"
        >
          {{ label }}
        </Checkbox>
      </FormItem>
    </Form>
    <Spin fix :show="loading" class="modal-loading" />
  </Modal>
</template>

<style lang="stylus" scoped>
.role-form
  padding 12px
  margin-bottom -30px
.role-checkbox
  margin-bottom 8px
.role-alert
  margin 10px 0 0
</style>
