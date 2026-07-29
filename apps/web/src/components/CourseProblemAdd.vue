<script setup lang="ts">
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/api'
import ProblemSelect from '@/components/ProblemSelect.vue'
import { useMessage } from '@/utils/message'

const props = defineProps<{
  modelValue: boolean
  courseId: number
}>()
const emit = defineEmits([ 'update:modelValue', 'close' ])
const { t } = useI18n()
const message = useMessage()

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
      message.success(t('oj.successfully_added_problems', { added }))
    } else {
      message.warn(t('oj.no_new_problems_added'))
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
  <Dialog
    v-model:visible="modal" modal :header="t('oj.add_course_problems')" :style="{ width: '32rem' }"
    :closable="false"
  >
    <div class="flex flex-col gap-2">
      <label class="font-semibold">{{ t('oj.problems_to_add') }}</label>
      <ProblemSelect v-model="selected" :scope="{ courseId }" />
    </div>

    <template #footer>
      <Button :label="t('oj.cancel')" severity="secondary" outlined @click="close()" />
      <Button :label="t('oj.confirm')" @click="submit" />
    </template>
  </Dialog>
</template>
