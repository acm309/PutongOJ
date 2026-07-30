<script setup lang="ts">
import type { AdminDiscussionUpdatePayload, DiscussionDetailQueryResult } from '@putongoj/shared'
import { DiscussionType } from '@putongoj/shared'
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Divider from 'primevue/divider'
import IftaLabel from 'primevue/iftalabel'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import SplitButton from 'primevue/splitbutton'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { updateDiscussion } from '@/api/admin'
import { createComment, getDiscussion } from '@/api/discussion'
import DiscussionTypeTag from '@/components/DiscussionTypeTag.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import UserSelect from '@/components/UserSelect.vue'
import { useSessionStore } from '@/store/modules/session'
import { timePretty } from '@/utils/format'
import { useMessage } from '@/utils/message'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const message = useMessage()

const { isLogined, isAdmin } = storeToRefs(useSessionStore())
const discussion = ref<DiscussionDetailQueryResult | null>(null)
const loading = ref(false)
const saving = ref(false)
const editDialog = ref(false)
const editingForm = ref({} as Required<AdminDiscussionUpdatePayload>)
const commentContent = ref('')
const creatingComment = ref(false)

const hasChanges = computed(() => {
  if (!discussion.value) return false
  return (
    editingForm.value.title !== discussion.value.title
    || editingForm.value.type !== discussion.value.type
    || editingForm.value.isPinned !== discussion.value.isPinned
    || editingForm.value.authorId !== discussion.value.author.id
    || (editingForm.value.problemId || null) !== (discussion.value.problem?.id || null)
    || (editingForm.value.contestId || null) !== (discussion.value.contest?.id || null)
  )
})

const canComment = computed(() => {
  if (!discussion.value) return false
  if (!isLogined.value) return false
  if (discussion.value.type === DiscussionType.ARCHIVED_DISCUSSION) return false
  if (discussion.value.type === DiscussionType.PUBLIC_ANNOUNCEMENT && !discussion.value.isJury) return false
  return true
})

const commentPlaceholder = computed(() => {
  if (!isLogined.value) return t('ptoj.login_to_comment')
  if (discussion.value?.type === DiscussionType.ARCHIVED_DISCUSSION) return t('ptoj.cannot_comment_archived_discussion')
  if (discussion.value?.type === DiscussionType.PUBLIC_ANNOUNCEMENT && !discussion.value.isJury) return t('ptoj.cannot_comment_announcement')
  return t('ptoj.enter_your_comment_here')
})

const discussionTypeOptions = computed(() => [ {
  value: DiscussionType.OPEN_DISCUSSION,
  label: t('ptoj.discussion'),
  desc: t('ptoj.discussion_type_desc'),
}, {
  value: DiscussionType.PUBLIC_ANNOUNCEMENT,
  label: t('ptoj.announcement'),
  desc: t('ptoj.announcement_type_desc'),
}, {
  value: DiscussionType.PRIVATE_CLARIFICATION,
  label: t('ptoj.clarification'),
  desc: t('ptoj.clarification_type_desc'),
}, {
  value: DiscussionType.ARCHIVED_DISCUSSION,
  label: t('ptoj.archived'),
  desc: t('ptoj.archived_type_desc'),
} ])

async function fetchDiscussion () {
  const discussionId = route.params.discussionId as string

  loading.value = true
  const resp = await getDiscussion(discussionId)
  loading.value = false
  if (!resp.success) {
    message.error(t('ptoj.failed_fetch_discussion'), resp.message)
    return
  }

  discussion.value = resp.data
}

function onEditDiscussion () {
  if (!discussion.value || !isAdmin.value) return
  editingForm.value = {
    title: discussion.value.title,
    type: discussion.value.type,
    isPinned: discussion.value.isPinned,
    authorId: discussion.value.author.id,
    problemId: discussion.value.problem?.id || null,
    contestId: discussion.value.contest?.id || null,
  }
  editDialog.value = true
}

function onFormAuthorBlur () {
  if (!editingForm.value.authorId) {
    editingForm.value.authorId = discussion.value!.author.id
  }
}

async function editDiscussion () {
  if (!discussion.value || !isAdmin.value) return

  const payload: AdminDiscussionUpdatePayload = {}
  if (editingForm.value.title !== discussion.value.title) {
    payload.title = editingForm.value.title
  }
  if (editingForm.value.type !== discussion.value.type) {
    payload.type = editingForm.value.type
  }
  if (editingForm.value.authorId !== discussion.value.author.id) {
    payload.authorId = editingForm.value.authorId
  }
  if ((editingForm.value.problemId || null) !== (discussion.value.problem?.id || null)) {
    payload.problemId = editingForm.value.problemId || null
  }
  if ((editingForm.value.contestId || null) !== (discussion.value.contest?.id || null)) {
    payload.contestId = editingForm.value.contestId || null
  }

  saving.value = true
  const resp = await updateDiscussion(discussion.value.id, payload)
  saving.value = false

  if (!resp.success) {
    message.error(t('ptoj.failed_save_changes'), resp.message)
    return
  }

  message.success(t('ptoj.successful_updated'), t('ptoj.discussion_updated_successfully'))
  editDialog.value = false
  await fetchDiscussion()
}

async function togglePinDiscussion () {
  if (!discussion.value || !isAdmin.value) return

  saving.value = true
  const resp = await updateDiscussion(discussion.value.id, {
    isPinned: !discussion.value.isPinned,
  })
  saving.value = false

  if (!resp.success) {
    message.error(t('ptoj.failed_save_changes'), resp.message)
    return
  }

  message.success(t('ptoj.successful_updated'), t('ptoj.discussion_updated_successfully'))
  await fetchDiscussion()
}

async function submitComment () {
  if (!discussion.value) return

  creatingComment.value = true
  const resp = await createComment(discussion.value.id, {
    content: commentContent.value.trim(),
  })
  creatingComment.value = false

  if (!resp.success) {
    message.error(t('ptoj.failed_create_comment'), resp.message)
    return
  }

  message.success(t('ptoj.successful_commented'), t('ptoj.comment_added_successfully'))
  commentContent.value = ''
  await fetchDiscussion()
}

function onViewAuthor (username: string) {
  router.push({ name: 'UserProfile', params: { username } })
}
function onViewProblem (problemId: number) {
  router.push({ name: 'problemInfo', params: { problemId } })
}
function onViewContest (contestId: number) {
  router.push({ name: 'ContestOverview', params: { contestId } })
}

onMounted(fetchDiscussion)
</script>

<template>
  <div class="max-w-4xl p-0">
    <template v-if="loading || !discussion">
      <div class="flex font-semibold gap-4 items-center pt-6 px-6">
        <i class="p-[4.5px] pi pi-comments text-2xl" />
        <h1 class="text-xl">
          {{ t('ptoj.discussion') }}
        </h1>
      </div>

      <div class="flex gap-4 items-center justify-center p-24">
        <template v-if="loading">
          <i class="pi pi-spin pi-spinner text-2xl" />
          <span>{{ t('ptoj.loading') }}</span>
        </template>
        <template v-else>
          <span>{{ t('ptoj.failed_load_discussion') }}</span>
        </template>
      </div>
    </template>

    <template v-else>
      <div class="flex gap-2 items-start justify-between pt-6 px-6">
        <div class="flex flex-wrap gap-1 items-center">
          <span class="flex gap-1">
            <Tag v-if="discussion.isPinned" icon="pi pi-thumbtack" />
            <DiscussionTypeTag :type="discussion.type" />
            <Tag :value="discussion.id" severity="secondary" icon="pi pi-hashtag" />
          </span>
          <span class="flex gap-1">
            <Tag
              v-if="discussion.contest" :value="discussion.contest.id" severity="secondary"
              class="cursor-pointer" icon="pi pi-trophy" @click="onViewContest(discussion.contest.id)"
            />
            <Tag
              v-if="discussion.problem" :value="discussion.problem.id" severity="secondary" class="cursor-pointer"
              icon="pi pi-flag" @click="onViewProblem(discussion.problem.id)"
            />
          </span>
        </div>
        <div class="flex gap-2">
          <Button icon="pi pi-refresh" severity="secondary" outlined :disabled="loading" @click="fetchDiscussion" />
          <SplitButton
            v-if="isAdmin" icon="pi pi-pen-to-square" severity="secondary" outlined :disabled="loading"
            :model="[{
              label: discussion.isPinned ? t('ptoj.unpin') : t('ptoj.pin'),
              icon: 'pi pi-thumbtack',
              command: () => togglePinDiscussion(),
            }]" @click="onEditDiscussion"
          >
            <template #item="{ item, props }">
              <span class="flex gap-2 items-center" v-bind="props.action">
                <span :class="item.icon" />
                <span>{{ item.label }}</span>
              </span>
            </template>
          </SplitButton>
        </div>
      </div>

      <h1 class="font-bold mb-4 pt-18 px-6 text-2xl">
        {{ discussion.title }}
      </h1>

      <div class="mb-6 px-6 space-y-4">
        <div
          v-for="(comment, index) in discussion.comments" :key="index"
          class="border border-surface flex flex-col gap-5 p-5 rounded-lg"
        >
          <div class="flex gap-4 items-start">
            <UserAvatar
              :image="comment.author.avatarUrl" class="cursor-pointer flex-none"
              @click="onViewAuthor(comment.author.username)"
            />
            <div class="cursor-pointer flex font-medium items-center min-h-8" @click="onViewAuthor(comment.author.username)">
              <span class="flex flex-wrap gap-2 items-center">
                <a class="text-lg">
                  {{ comment.author.username }}
                </a>
                <span v-if="comment.author.nickname" class="text-muted-color">
                  {{ comment.author.nickname }}
                </span>
              </span>
            </div>
          </div>
          <div class="-mb-2 -mt-1 leading-relaxed whitespace-pre-wrap wrap-break-word">
            {{ comment.content }}
          </div>
          <div class="-mb-0.5 text-muted-color text-sm">
            {{ timePretty(comment.createdAt) }}
          </div>
        </div>
      </div>

      <Divider type="dashed" />

      <div class="mt-6 pb-6 px-6 space-y-4">
        <h2 class="font-semibold mb-4 text-lg">
          {{ t('ptoj.add_a_comment') }}
        </h2>
        <IftaLabel>
          <Textarea
            id="comment" v-model="commentContent" :placeholder="commentPlaceholder" :disabled="!canComment"
            fluid rows="7" auto-resize
          />
          <label for="comment">{{ t('ptoj.comment') }}</label>
        </IftaLabel>
        <div class="flex justify-end">
          <Button
            :label="t('ptoj.submit_comment')" icon="pi pi-send" :disabled="!canComment || !commentContent.trim()"
            :loading="creatingComment" @click="submitComment"
          />
        </div>
      </div>
    </template>

    <Dialog
      v-model:visible="editDialog" :header="t('ptoj.edit_discussion')" modal :closable="false"
      class="max-w-md mx-6 w-full"
    >
      <form @submit.prevent="editDiscussion">
        <div class="space-y-4">
          <IftaLabel>
            <InputText
              id="title" v-model="editingForm.title" fluid :placeholder="t('ptoj.enter_title')" maxlength="80"
              required
            />
            <label for="title">{{ t('ptoj.title') }}</label>
          </IftaLabel>
          <IftaLabel>
            <Select
              id="type" v-model="editingForm.type" fluid :options="discussionTypeOptions" option-label="label"
              option-value="value"
            >
              <template #option="{ option }">
                <div class="flex gap-2 items-center">
                  <DiscussionTypeTag :type="option.value" />
                  <span class="text-muted text-sm">{{ option.desc }}</span>
                </div>
              </template>
            </Select>
            <label for="type">{{ t('ptoj.type') }}</label>
          </IftaLabel>
          <UserSelect v-model="editingForm.authorId" :label="t('ptoj.author')" required @blur="onFormAuthorBlur" />
          <IftaLabel>
            <InputNumber
              id="problem" v-model="editingForm.problemId" mode="decimal" :min="1" fluid :use-grouping="false"
              :placeholder="t('ptoj.enter_problem_id')"
            />
            <label for="problem">{{ t('ptoj.problem') }}</label>
          </IftaLabel>
          <IftaLabel>
            <InputNumber
              id="contest" v-model="editingForm.contestId" mode="decimal" :min="1" fluid :use-grouping="false"
              :placeholder="t('ptoj.enter_contest_id')"
            />
            <label for="contest">{{ t('ptoj.contest') }}</label>
          </IftaLabel>
        </div>
        <div class="flex gap-2 justify-end mt-5">
          <Button
            type="button" :label="t('ptoj.cancel')" icon="pi pi-times" severity="secondary" outlined
            @click="editDialog = false"
          />
          <Button
            type="submit" :label="t('ptoj.save_changes')" icon="pi pi-check" :disabled="!hasChanges"
            :loading="saving"
          />
        </div>
      </form>
    </Dialog>
  </div>
</template>
