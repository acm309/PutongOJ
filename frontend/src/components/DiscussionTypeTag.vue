<script lang="ts" setup>
import { DiscussionType } from '@putongoj/shared'
import Tag from 'primevue/tag'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  type: DiscussionType
}>()

const { t } = useI18n()

const discussionTypeLabels = computed(() => ({
  [DiscussionType.OpenDiscussion]: t('ptoj.discussion'),
  [DiscussionType.PublicAnnouncement]: t('ptoj.announcement'),
  [DiscussionType.PrivateClarification]: t('ptoj.clarification'),
  [DiscussionType.ArchivedDiscussion]: t('ptoj.archived'),
} as Record<DiscussionType, string>))

const discussionTypeSeverties = {
  [DiscussionType.OpenDiscussion]: 'success',
  [DiscussionType.PublicAnnouncement]: 'warning',
  [DiscussionType.PrivateClarification]: 'info',
  [DiscussionType.ArchivedDiscussion]: 'warn',
} as Record<DiscussionType, string>

const discussionTypeIcons = {
  [DiscussionType.OpenDiscussion]: 'pi pi-comments',
  [DiscussionType.PublicAnnouncement]: 'pi pi-megaphone',
  [DiscussionType.PrivateClarification]: 'pi pi-info-circle',
  [DiscussionType.ArchivedDiscussion]: 'pi pi-lock',
} as Record<DiscussionType, string>
</script>

<template>
  <Tag
    :icon="discussionTypeIcons[props.type]"
    :value="discussionTypeLabels[props.type]"
    :severity="discussionTypeSeverties[props.type]"
  />
</template>
