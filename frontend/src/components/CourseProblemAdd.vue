<script setup lang="ts">
import { Form, FormItem, Message, Modal } from 'view-ui-plus'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/api'
import ProblemSelect from '@/components/ProblemSelect.vue'

const props = defineProps<{
  modelValue: boolean
  courseId: number
}>()
const emit = defineEmits([ 'update:modelValue', 'close' ])
const { t } = useI18n()

const modal = ref(false)
const selected = ref<number[]>([])

function close (added: number = 0) {
  emit('update:modelValue', false)
  emit('close', added)
  modal.value = false
  selected.value = []
}

async function submit () {
  try {
    const { data: { added } } = await api.course.addProblems(props.courseId, selected.value)
    if (added > 0) {
      Message.success(t('oj.successfully_added_problems', { added }))
    } else {
      Message.warning(t('oj.no_new_problems_added'))
    }
    close(added)
  } catch (error: any) {
    console.error(`Failed to add problems: ${error.message}`)
    close()
  }
}

watch(() => props.modelValue, (val) => {
  modal.value = val
})
</script>

<template>
  <Modal
    v-model="modal" :loading="true" :title="t('oj.add_course_problems')" :closable="false" @on-cancel="close"
    @on-ok="submit"
  >
    <Form>
      <FormItem :label="t('oj.problems_to_add')">
        <ProblemSelect
          v-model="selected" multiple :scope="{ courseId }"
        />
      </FormItem>
    </Form>
  </Modal>
</template>
