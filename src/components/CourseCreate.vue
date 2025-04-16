<script lang="ts" setup>
import type { Message } from 'view-ui-plus'
import { Form, FormItem, Input, Modal, Radio, RadioGroup } from 'view-ui-plus'
import { inject, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCourseStore } from '@/store/modules/course'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
})
const emit = defineEmits([ 'update:modelValue' ])

const message = inject('$Message') as typeof Message
const courseStore = useCourseStore()
const { create } = courseStore
const router = useRouter()

let modal = $ref(false)

watch(() => props.modelValue, (val) => {
  modal = val
})
function close () {
  modal = false
  emit('update:modelValue', false)
}

const courseRules = $computed(() => ({
  name: [
    { required: true, message: 'Name is required', trigger: 'change' },
    { min: 3, message: 'Name length should be at least 3', trigger: 'change' },
  ],
  description: [],
  encrypt: [ { type: 'number', required: true, trigger: 'change' } ],
}))
const courseForm = $ref({
  name: '',
  description: '',
  encrypt: 2,
})
const courseFormRef = ref<any>(null)

function submit () {
  courseFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        const id = await create(courseForm)
        message.success('Course created successfully.')
        router.push({ name: 'course', params: { id } })
      } catch (e: any) {
        message.error(`Failed to create course: ${e.message}`)
      }
    } else {
      message.warning('Not a valid form, skipped.')
    }
    close()
  })
}
</script>

<template>
  <Modal
    v-model="modal" :loading="true"
    title="Create Course" :closable="false"
    @on-cancel="close" @on-ok="submit"
  >
    <Form
      ref="courseFormRef"
      class="course-form" :label-width="80"
      :model="courseForm" :rules="courseRules"
    >
      <FormItem label="Name" prop="name">
        <Input
          v-model="courseForm.name"
          :maxlength="20" show-word-limit
          placeholder="Enter course name"
        />
      </FormItem>
      <FormItem label="Description" prop="description">
        <Input
          v-model="courseForm.description" type="textarea"
          :maxlength="100" show-word-limit :autosize="{ minRows: 2, maxRows: 5 }"
          placeholder="Enter course description"
        />
      </FormItem>
      <FormItem label="Encrypt" prop="encrypt">
        <RadioGroup v-model="courseForm.encrypt" type="button">
          <Radio :label="1">
            Public
          </Radio>
          <Radio :label="2">
            Private
          </Radio>
        </RadioGroup>
      </FormItem>
    </Form>
  </Modal>
</template>

<style lang="stylus" scoped>
.course-form
  padding 12px
  margin-bottom -24px
</style>
