<script lang="ts" setup>
import { watch } from 'vue'
import { Checkbox, Form, FormItem, Input, Modal } from 'view-ui-plus'
import type { CourseRole } from '@/types'

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
const role = $ref({ ...props.role })
const disabled = $ref({
  basic: true,
  viewTestcase: false,
  viewSolution: false,
  manageProblem: false,
  manageContest: false,
  manageCourse: false,
})

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
</script>

<template>
  <Modal
    v-model="modal" :loading="true"
    title="Edit Course Role" :closable="false"
    @on-cancel="close" @on-ok="close"
  >
    <Form class="role-form" :label-width="80">
      <FormItem label="User">
        <Input v-model="uid" disabled />
      </FormItem>
      <FormItem label="Role">
        <Checkbox
          v-for="(label, field) in roleConfig" :key="field" v-model="role[field]"
          class="role-checkbox" :disabled="disabled[field]" border
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
