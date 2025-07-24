<script setup lang="ts">
import type { Message } from 'view-ui-plus'
import { storeToRefs } from 'pinia'
import { Form, FormItem, Input, Radio, RadioGroup } from 'view-ui-plus'
import { inject, ref } from 'vue'
import api from '@/api'
import { useCourseStore } from '@/store/modules/course'

const courseStore = useCourseStore()
const { course } = storeToRefs(courseStore)
const message = inject('$Message') as typeof Message

const submiting = ref(false)
const courseRules = {
  name: [
    { required: true, message: 'Course name is required', trigger: 'change' },
    { min: 3, message: 'Course name must be at least 3 characters', trigger: 'change' },
  ],
  description: [ { max: 100, message: 'Description should not exceed 100 characters', trigger: 'change' } ],
  encrypt: [ { type: 'number', required: true, trigger: 'change' } ],
}
const courseFormRef = ref<any>(null)

function updateCourse () {
  courseFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      submiting.value = true
      try {
        await api.course.updateCourse(course.value.courseId, {
          name: course.value.name,
          description: course.value.description,
          encrypt: course.value.encrypt,
        })
        message.success('Course updated successfully.')
      } catch (e: any) {
        message.error(`Failed to update course: ${e.message}`)
      } finally {
        submiting.value = false
      }
    } else {
      message.warning('Form is not valid, please check your input.')
    }
  })
}
</script>

<template>
  <div class="course-settings">
    <Form ref="courseFormRef" :model="course" :label-width="100" :rules="courseRules">
      <FormItem label="Name" prop="name">
        <Input v-model="course.name" :maxlength="20" show-word-limit placeholder="Enter course name" />
      </FormItem>
      <FormItem label="Description" prop="description">
        <Input
          v-model="course.description" type="textarea" :maxlength="100" show-word-limit
          :autosize="{ minRows: 2, maxRows: 5 }" placeholder="Enter course description"
        />
      </FormItem>
      <FormItem label="Encryption" prop="encrypt">
        <RadioGroup v-model="course.encrypt">
          <Radio :label="1" border>
            Public
          </Radio>
          <Radio :label="2" border>
            Private
          </Radio>
        </RadioGroup>
      </FormItem>
      <FormItem>
        <Button type="primary" size="large" :loading="submiting" @click="updateCourse">
          Submit
        </Button>
      </FormItem>
    </Form>
  </div>
</template>

<style lang="stylus" scoped>
.course-settings
    padding 0 40px 40px
@media screen and (max-width: 1024px)
  .course-settings
    padding 0 20px 20px
</style>
