<script setup lang="ts">
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import IftaLabel from 'primevue/iftalabel'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import LabeledSwitch from '@/components/LabeledSwitch.vue'
import { useCourseStore } from '@/store/modules/course'
import { useMessage } from '@/utils/message'

const visible = defineModel<boolean>('visible')

const { t } = useI18n()
const message = useMessage()
const courseStore = useCourseStore()
const router = useRouter()

const submitting = ref(false)
const form = ref({
  name: '',
  description: '',
  isPublic: false,
})

async function submit () {
  if (!form.value.name || form.value.name.length < 3 || form.value.name.length > 30) {
    message.warn(t('oj.course_name_required'))
    return
  }
  if (form.value.description && form.value.description.length > 100) {
    message.warn(t('oj.course_description_length'))
    return
  }

  submitting.value = true
  try {
    const id = await courseStore.createCourse({
      name: form.value.name,
      description: form.value.description,
      encrypt: form.value.isPublic ? 1 : 2,
    } as any)
    message.success(t('oj.course_create_success'))
    router.push({ name: 'courseProblems', params: { id } })
    visible.value = false
  } catch (e: any) {
    message.error(t('oj.course_create_failed', { error: e.message }))
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <Dialog
    v-model:visible="visible" modal :header="t('oj.course_create')" :closable="false"
    class="max-w-md mx-6 w-full"
  >
    <form @submit.prevent="submit">
      <div class="space-y-4">
        <IftaLabel>
          <InputText id="name" v-model="form.name" required fluid :maxlength="30" />
          <label for="name">{{ t('oj.name') }}</label>
        </IftaLabel>

        <IftaLabel>
          <Textarea
            id="description" v-model="form.description" class="-mb-1.25" :maxlength="100" :rows="3" auto-resize
            fluid
          />
          <label for="description">{{ t('oj.course_description') }}</label>
        </IftaLabel>

        <LabeledSwitch v-model="form.isPublic" :label="t('ptoj.public')" :description="t('ptoj.anyone_can_join')" />
      </div>
      <div class="flex gap-2 justify-end mt-5">
        <Button
          type="button" :label="t('ptoj.cancel')" icon="pi pi-times" severity="secondary" outlined
          @click="visible = false"
        />
        <Button type="submit" :label="t('ptoj.create')" icon="pi pi-check" :loading="submitting" />
      </div>
    </form>
  </Dialog>
</template>
