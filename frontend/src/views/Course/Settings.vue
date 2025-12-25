<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { Button, Col, Divider, Form, FormItem, Input, Message, Poptip, Radio, RadioGroup, Row } from 'view-ui-plus'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/api'
import { useCourseStore } from '@/store/modules/course'
import { useSessionStore } from '@/store/modules/session'

const { t } = useI18n()
const sessionStore = useSessionStore()
const courseStore = useCourseStore()
const { isRoot } = storeToRefs(sessionStore)
const { course } = storeToRefs(courseStore)

const submiting = ref(false)
const courseRules = {
  name: [
    { required: true, message: t('oj.course_name_required'), trigger: 'change' },
    { min: 3, message: t('oj.course_name_min_length'), trigger: 'change' },
  ],
  description: [ { max: 100, message: t('oj.description_max_length'), trigger: 'change' } ],
  encrypt: [ { type: 'number', required: true, trigger: 'change' } ],
  joinCode: [ { min: 6, max: 20, message: t('oj.join_code_length'), trigger: 'change' } ],
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
          joinCode: course.value.joinCode || '',
        })
        Message.success(t('oj.course_updated_successfully'))
      } catch (e: any) {
        Message.error(t('oj.failed_to_update_course', { error: e.message }))
      } finally {
        submiting.value = false
      }
    } else {
      Message.warning(t('oj.form_invalid'))
    }
  })
}

function rearrangeProblems () {
  api.course.rearrangeProblems(course.value.courseId)
  Message.info(t('oj.rearrange_task_dispatched'))
}
</script>

<template>
  <div class="course-settings">
    <Form ref="courseFormRef" :model="course" :label-width="100" :rules="courseRules">
      <FormItem prop="name">
        <template #label>
          <span style="line-height: 20px;">{{ t('oj.name') }}</span>
        </template>
        <Input v-model="course.name" size="large" :maxlength="30" show-word-limit :placeholder="t('oj.enter_course_name')" />
      </FormItem>
      <FormItem :label="t('oj.description')" prop="description">
        <Input
          v-model="course.description" type="textarea" :maxlength="100" show-word-limit
          :autosize="{ minRows: 2, maxRows: 5 }" :placeholder="t('oj.enter_course_description')"
        />
      </FormItem>
      <FormItem :label="t('oj.encryption')" prop="encrypt">
        <RadioGroup v-model="course.encrypt">
          <Radio :label="1" border>
            {{ t('oj.public') }}
          </Radio>
          <Radio :label="2" border>
            {{ t('oj.private') }}
          </Radio>
        </RadioGroup>
      </FormItem>
      <FormItem :label="t('oj.join_code')" prop="joinCode">
        <Input
          v-model="course.joinCode" :maxlength="20" show-word-limit :placeholder="t('oj.enter_join_code_optional')"
          clearable
        />
      </FormItem>
      <FormItem>
        <Button type="primary" size="large" :loading="submiting" @click="updateCourse">
          {{ t('oj.submit') }}
        </Button>
      </FormItem>
    </Form>
    <template v-if="isRoot">
      <Divider simple>
        {{ t('oj.system_action') }}
      </Divider>
      <Row>
        <Col flex="auto">
          <span style="line-height: 32px; padding-left: 16px;">
            {{ t('oj.problem_sort_rearrange') }}
          </span>
        </Col>
        <Col>
          <Poptip confirm :title="t('oj.confirm')" @on-ok="rearrangeProblems">
            <Button>{{ t('oj.execute') }}</Button>
          </Poptip>
        </Col>
      </Row>
    </template>
  </div>
</template>

<style lang="stylus" scoped>
.course-settings
  padding 0 40px 40px !important
@media screen and (max-width: 1024px)
  .course-settings
    padding 0 20px 20px
</style>
