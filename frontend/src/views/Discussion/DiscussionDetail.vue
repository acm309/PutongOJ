<script lang="ts" setup>
import type { DiscussionDetailQueryResult } from '@putongoj/shared'
import { storeToRefs } from 'pinia'
import Avatar from 'primevue/avatar'
import Button from 'primevue/button'
import Panel from 'primevue/panel'
import Tag from 'primevue/tag'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { getDiscussion } from '@/api/discussion'
import DiscussionTypeTag from '@/components/DiscussionTypeTag.vue'
import { useSessionStore } from '@/store/modules/session'
import { spacing, timePretty } from '@/utils/formate'
import { useMessage } from '@/utils/message'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const message = useMessage()

const { isLogined: _WIP_ } = storeToRefs(useSessionStore())
const discussion = ref<DiscussionDetailQueryResult | null>(null)
const loading = ref(false)

async function fetchDiscussion () {
  const discussionId = route.params.discussionId as string
  if (!discussionId) {
    message.error(t('ptoj.invalid_discussion_id'))
    return
  }

  loading.value = true
  const resp = await getDiscussion(discussionId)
  loading.value = false
  if (!resp.success) {
    message.error(t('ptoj.failed_fetch_discussion'), resp.message)
    return
  }

  discussion.value = resp.data
}

function onViewAuthor (uid: string) {
  router.push({ name: 'UserProfile', params: { uid } })
}

onMounted(fetchDiscussion)
</script>

<template>
  <div class="max-w-4xl p-6">
    <template v-if="loading || !discussion">
      <div class="flex font-semibold gap-4 items-center">
        <i class="pi pi-comments text-2xl" />
        <h1 class="text-xl">
          {{ t('ptoj.discussion') }}
        </h1>
      </div>

      <div class="flex gap-4 items-center justify-center pb-18 pt-24">
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
      <div class="flex items-start justify-between">
        <div class="flex gap-2 items-center">
          <Tag :value="discussion.discussionId" severity="secondary" icon="pi pi-hashtag" />
          <DiscussionTypeTag :type="discussion.type" />
          <!-- TODO: Relative problem/contest link -->
        </div>
        <Button icon="pi pi-refresh" severity="secondary" outlined :disabled="loading" @click="fetchDiscussion" />
      </div>

      <h1 class="font-bold mb-4 pt-12 text-2xl">
        {{ spacing(discussion.title) }}
      </h1>

      <div class="space-y-4">
        <Panel v-for="(comment, index) in discussion.comments" :key="index">
          <template #header>
            <div class="flex gap-4 items-start">
              <Avatar
                :label="comment.author.uid[0]" class="cursor-pointer flex-none"
                @click="onViewAuthor(comment.author.uid)"
              />
              <div
                class="cursor-pointer flex font-medium items-center min-h-8"
                @click="onViewAuthor(comment.author.uid)"
              >
                <span class="flex flex-wrap gap-2 items-center">
                  <a class="text-lg">
                    {{ comment.author.uid }}
                  </a>
                  <span v-if="comment.author.nick" class="text-muted-color">
                    {{ comment.author.nick }}
                  </span>
                </span>
              </div>
            </div>
          </template>
          <template #footer>
            <div class="text-muted-color text-sm">
              {{ timePretty(comment.createdAt) }}
            </div>
          </template>
          <div class="-mb-2 -mt-1 leading-relaxed whitespace-pre-wrap">
            {{ spacing(comment.content) }}
          </div>
        </Panel>
      </div>
    </template>
  </div>
</template>
