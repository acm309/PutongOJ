<script setup lang="ts">
import type { AdminPostDetailQueryResult, AdminPostUpdatePayload } from '@putongoj/shared'
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import DatePicker from 'primevue/datepicker'
import IftaLabel from 'primevue/iftalabel'
import InputText from 'primevue/inputtext'
import { useConfirm } from 'primevue/useconfirm'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { deletePost, getPost, updatePost } from '@/api/admin'
import LabeledSwitch from '@/components/LabeledSwitch.vue'
import MarkdownEditor from '@/components/MarkdownEditor.vue'
import { useSessionStore } from '@/store/modules/session'
import { useMessage } from '@/utils/message'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const confirm = useConfirm()
const message = useMessage()
const post = ref<AdminPostDetailQueryResult | null>(null)
const editingPost = ref<Required<Omit<AdminPostUpdatePayload, 'publishesAt'>> & { publishesAt: Date }>({
  title: '',
  slug: '',
  content: '',
  isPinned: false,
  isHidden: false,
  isPublished: false,
  publishesAt: new Date(),
})
const { isRoot } = storeToRefs(useSessionStore())
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)

const hasChanges = computed(() => {
  if (!post.value) {
    return false
  }
  return editingPost.value.title !== post.value.title
    || editingPost.value.slug !== post.value.slug
    || editingPost.value.content !== post.value.content
    || editingPost.value.isPinned !== post.value.isPinned
    || editingPost.value.isHidden !== post.value.isHidden
    || editingPost.value.isPublished !== post.value.isPublished
    || editingPost.value.publishesAt.getTime() !== new Date(post.value.publishesAt).getTime()
})

function setEditingPost () {
  if (!post.value) {
    return
  }
  editingPost.value = {
    title: post.value.title,
    slug: post.value.slug,
    content: post.value.content,
    isPinned: post.value.isPinned,
    isHidden: post.value.isHidden,
    isPublished: post.value.isPublished,
    publishesAt: new Date(post.value.publishesAt),
  }
}

async function fetchPost () {
  loading.value = true
  const resp = await getPost(String(route.params.slug))
  loading.value = false

  if (!resp.success || !resp.data) {
    message.error(resp.message)
    router.replace({ name: 'PostManagement' })
    return
  }
  post.value = resp.data
  setEditingPost()
}

onMounted(fetchPost)
watch(() => route.params.slug, fetchPost)

async function submit () {
  if (!post.value || editingPost.value.title?.trim().length === 0) {
    message.error(t('ptoj.title_required'))
    return
  }

  const payload: AdminPostUpdatePayload = {}
  if (editingPost.value.title !== post.value.title) {
    payload.title = editingPost.value.title
  }
  if (editingPost.value.slug !== post.value.slug) {
    payload.slug = editingPost.value.slug
  }
  if (editingPost.value.content !== post.value.content) {
    payload.content = editingPost.value.content
  }
  if (editingPost.value.isPinned !== post.value.isPinned) {
    payload.isPinned = editingPost.value.isPinned
  }
  if (editingPost.value.isHidden !== post.value.isHidden) {
    payload.isHidden = editingPost.value.isHidden
  }
  if (editingPost.value.isPublished !== post.value.isPublished) {
    payload.isPublished = editingPost.value.isPublished
  }
  if (editingPost.value.publishesAt.getTime() !== new Date(post.value.publishesAt).getTime()) {
    payload.publishesAt = editingPost.value.publishesAt
  }

  if (Object.keys(payload).length === 0) {
    return
  }

  try {
    saving.value = true
    const resp = await updatePost(String(route.params.slug), payload)
    saving.value = false

    if (!resp.success || !resp.data) {
      message.error(resp.message)
      return
    }

    const slug = resp.data.slug
    message.success(t('ptoj.successful_update_post_detail', { title: editingPost.value.title ?? post.value.title }))
    router.push({ name: 'PostDetail', params: { slug } })
  } catch (err: any) {
    saving.value = false
    message.error(err.message)
  }
}

function del (event: Event) {
  if (!isRoot.value) {
    return
  }

  return confirm.require({
    target: event.currentTarget as HTMLElement,
    message: t('ptoj.confirm_delete_post'),
    rejectProps: {
      label: t('ptoj.cancel'),
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: t('ptoj.delete'),
      severity: 'danger',
    },
    accept: async () => {
      const { slug } = post.value!
      deleting.value = true
      const resp = await deletePost(slug)
      deleting.value = false

      if (!resp.success) {
        message.error(resp.message)
        return
      }
      message.success(t('ptoj.successful_delete_post_detail', { slug }))
      router.push({ name: 'PostManagement' })
    },
  })
}
</script>

<template>
  <div class="max-w-6xl p-0">
    <div class="flex items-center justify-between pt-6 px-6">
      <div class="flex font-semibold gap-4 items-center">
        <i class="p-[4.5px] pi pi-file-edit text-2xl" />
        <h1 class="text-xl">
          {{ t('ptoj.edit_post') }}
        </h1>
      </div>

      <RouterLink v-if="post" :to="{ name: 'PostDetail', params: { slug: post.slug } }">
        <Button outlined :label="t('ptoj.view_post')" icon="pi pi-eye" />
      </RouterLink>
    </div>

    <template v-if="loading || !post">
      <div class="flex gap-4 items-center justify-center px-6 py-24">
        <i v-if="loading" class="pi pi-spin pi-spinner text-2xl" />
        <span>{{ loading ? t('ptoj.loading') : t('ptoj.failed_fetch_data') }}</span>
      </div>
    </template>

    <template v-else>
      <div class="gap-x-4 gap-y-6 grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 p-6 pt-5">
        <IftaLabel class="lg:col-span-3 md:col-span-2">
          <InputText id="post-title" v-model="editingPost.title" type="text" fluid :placeholder="t('ptoj.title')" />
          <label for="post-title">{{ t('ptoj.title') }}</label>
        </IftaLabel>

        <IftaLabel class="md:col-span-2">
          <InputText id="post-slug" v-model="editingPost.slug" type="text" fluid :placeholder="t('ptoj.slug')" />
          <label for="post-slug">{{ t('ptoj.slug') }}</label>
        </IftaLabel>

        <IftaLabel>
          <DatePicker
            id="post-publishes-at" v-model="editingPost.publishesAt" show-time show-seconds
            date-format="yy-mm-dd" time-format="HH:mm:ss" :step-second="15" fluid
            :placeholder="t('ptoj.publishes_at')"
          />
          <label for="post-publishes-at">{{ t('ptoj.publishes_at') }}</label>
        </IftaLabel>

        <LabeledSwitch v-model="editingPost.isPinned" :label="t('ptoj.pin')" :description="t('ptoj.pin_post_desc')" />

        <LabeledSwitch
          v-model="editingPost.isHidden" :label="t('ptoj.hide_post')"
          :description="t('ptoj.hide_post_desc')"
        />

        <LabeledSwitch
          v-model="editingPost.isPublished" :label="t('ptoj.publish_post')"
          :description="t('ptoj.publish_post_desc')"
        />
      </div>

      <div class="border-surface border-y">
        <MarkdownEditor v-model="editingPost.content" :height="768" />
      </div>

      <div class="flex justify-between p-6">
        <Button
          :label="t('ptoj.save_changes')" icon="pi pi-send" :loading="saving"
          :disabled="saving || deleting || !hasChanges" @click="submit"
        />

        <Button
          v-if="isRoot" :label="t('ptoj.delete')" icon="pi pi-trash" severity="danger" outlined
          :loading="deleting" :disabled="saving || deleting" @click="del"
        />
      </div>
    </template>
  </div>
</template>
