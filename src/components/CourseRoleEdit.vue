<script lang="ts" setup>
import debounce from 'lodash.debounce'
import { watch } from 'vue'
import { Checkbox, Form, FormItem, Modal, Option, Select } from 'view-ui-plus'
import type { CourseRole } from '@/types'
import api from '@/api'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  course: {
    type: Number,
    required: true,
  },
  uid: {
    type: String,
    default: '',
  },
  role: {
    type: Object as () => CourseRole,
    default: () => ({
      basic: true,
      viewTestcase: false,
      viewSolution: false,
      manageProblem: false,
      manageContest: false,
      manageCourse: false,
    }),
  },
})
const emit = defineEmits([ 'update:modelValue' ])

const roleConfig = {
  basic: 'Basic View',
  viewTestcase: 'View Testcase',
  viewSolution: 'View Solution',
  manageProblem: 'Manage Problem',
  manageContest: 'Manage Contest',
  manageCourse: 'Manage Course',
} as const

let modal: boolean = $ref(false)
let uid: string = $ref('')
let edit: boolean = $ref(!!props.uid)
let loadingUsers: boolean = $ref(false)
const role = $ref({ ...props.role })
const disabled = $ref({
  basic: true,
  viewTestcase: false,
  viewSolution: false,
  manageProblem: false,
  manageContest: false,
  manageCourse: false,
})
const users = $ref(props.uid
  ? [ {
      value: props.uid,
      label: props.uid,
    } ]
  : [])

watch(() => props.modelValue, (val) => {
  modal = val
})
watch(() => props.role, (val) => {
  Object.entries(val).forEach(([ key, value ]) => {
    role[key as keyof CourseRole] = value
  })
})
watch(() => props.uid, (val) => {
  uid = val
  edit = !!val
  users.length = 0
  if (val) {
    users.push({
      value: val,
      label: val,
    })
  }
})
function close () {
  modal = false
  emit('update:modelValue', false)
}

watch(() => role.manageCourse, (val) => {
  const related = {
    viewTestcase: val || role.manageProblem,
    viewSolution: val,
    manageProblem: val,
    manageContest: val,
  }
  Object.assign(disabled, related)
  if (val) Object.assign(role, related)
})
watch(() => role.manageProblem, (val) => {
  disabled.viewTestcase = val
  if (val) role.viewTestcase = true
})

const fetchUsers = debounce(
  async (query: string) => {
    if (query.length === 0) {
      users.length = 0
      return
    }
    loadingUsers = true
    const { data: found } = await api.user.find({ type: 'name', content: query, page: 1, pageSize: 30 })
    users.length = 0
    found.docs.forEach((user) => {
      users.push({
        value: user.uid,
        label: user.uid + (user.nick ? ` (${user.nick})` : ''),
      })
    })
    loadingUsers = false
  },
  500,
)
</script>

<template>
  <Modal v-model="modal" :loading="true" title="Edit Course Role" :closable="false" @on-cancel="close" @on-ok="close">
    <Form class="role-form" :label-width="80">
      <FormItem label="User">
        <Select v-model="uid" :disabled="edit" filterable :remote-method="fetchUsers" :loading="loadingUsers">
          <Option v-for="user in users" :key="user.value" :value="user.value" :label="user.label" />
        </Select>
      </FormItem>
      <FormItem label="Role">
        <Checkbox
          v-for="(label, field) in roleConfig" :key="field" v-model="role[field]" class="role-checkbox"
          :disabled="disabled[field]" border
        >
          {{ label }}
        </Checkbox>
      </FormItem>
    </Form>
  </Modal>
</template>

<style lang="stylus" scoped>
.role-form
  padding 12px
  margin-bottom -30px
.role-checkbox
  margin-bottom 8px
</style>
