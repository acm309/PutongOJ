<script setup lang="ts">
import type { AdminPostCreatePayload } from '@putongoj/shared'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import IftaLabel from 'primevue/iftalabel'
import InputText from 'primevue/inputtext'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { createPost } from '@/api/admin'
import { useMessage } from '@/utils/message'

const visible = defineModel<boolean>('visible')

const { t } = useI18n()
const router = useRouter()
const message = useMessage()

const submitting = ref(false)
const form = ref<AdminPostCreatePayload>({
  title: '',
})

async function submit () {
  const title = form.value.title.trim()
  if (!title) {
    message.error(t('ptoj.title_required'))
    return
  }

  submitting.value = true
  const resp = await createPost({ title })
  submitting.value = false

  if (!resp.success || !resp.data) {
    message.error(t('ptoj.failed_create_post'), resp.message)
    return
  }

  visible.value = false
  form.value.title = ''

  const { slug } = resp.data
  message.success(t('ptoj.successful_create_post_detail', { slug }))
  router.push({ name: 'PostManagementDetail', params: { slug } })
}
</script>

<template>
  <Dialog
    v-model:visible="visible" modal :header="t('ptoj.create_post')" :closable="false"
    class="max-w-md mx-6 w-full"
  >
    <form @submit.prevent="submit">
      <IftaLabel>
        <InputText id="title" v-model="form.title" required fluid />
        <label for="title">{{ t('ptoj.title') }}</label>
      </IftaLabel>

      <div class="flex gap-2 justify-end mt-5">
        <Button
          type="button" :label="t('ptoj.cancel')" icon="pi pi-times" severity="secondary" outlined
          @click="visible = false"
        />
        <Button type="submit" :label="t('ptoj.create_post')" icon="pi pi-check" :loading="submitting" />
      </div>
    </form>
  </Dialog>
</template>
