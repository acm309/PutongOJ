<script lang="ts" setup>
import type { Message } from 'view-ui-plus'
import { Form, FormItem, Input, Modal, Radio, RadioGroup } from 'view-ui-plus'
import { inject, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useCourseStore } from '@/store/modules/course'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
})
const emit = defineEmits([ 'update:modelValue' ])

const { t } = useI18n()
const message = inject('$Message') as typeof Message
const courseStore = useCourseStore()
const { createCourse } = courseStore
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
    { required: true, message: t('oj.course_name_required'), trigger: 'change' },
    { min: 3, max: 30, message: t('oj.course_name_length'), trigger: 'change' },
  ],
  description: [ { max: 100, message: t('oj.course_description_length'), trigger: 'change' } ],
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
        const id = await createCourse(courseForm as any)
        message.success(t('oj.course_create_success'))
        router.push({ name: 'courseProblems', params: { id } })
      } catch (e: any) {
        message.error(t('oj.course_create_failed', { error: e.message }))
      }
    } else {
      message.warning(t('oj.form_invalid'))
    }
    close()
  })
}
</script>

<template>
  <Modal
    v-model="modal" :loading="true"
    :title="t('oj.course_create')" :closable="false"
    @on-cancel="close" @on-ok="submit"
  >
    <Form
      ref="courseFormRef"
      class="course-form" :label-width="80"
      :model="courseForm" :rules="courseRules"
    >
      <FormItem prop="name">
        <template #label>
          <span style="line-height: 20px;">{{ t('oj.name') }}</span>
        </template>
        <Input
          v-model="courseForm.name" size="large"
          :maxlength="30" show-word-limit
          :placeholder="t('oj.course_name_placeholder')"
        />
      </FormItem>
      <FormItem :label="t('oj.course_description')" prop="description">
        <Input
          v-model="courseForm.description" type="textarea"
          :maxlength="100" show-word-limit :autosize="{ minRows: 2, maxRows: 5 }"
          :placeholder="t('oj.course_description_placeholder')"
        />
      </FormItem>
      <FormItem :label="t('oj.course_encrypt')" prop="encrypt">
        <RadioGroup v-model="courseForm.encrypt" type="button">
          <Radio :label="1">
            {{ t('oj.course_public') }}
          </Radio>
          <Radio :label="2">
            {{ t('oj.course_private') }}
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
