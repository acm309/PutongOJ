<script setup lang="ts">
import { DiscussionType } from '@putongoj/shared'
import Tag from 'primevue/tag'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  type: DiscussionType
}>()

const { t } = useI18n()

const discussionTypeLabels = computed(() => ({
  [DiscussionType.OPEN_DISCUSSION]: t('ptoj.discussion'),
  [DiscussionType.PUBLIC_ANNOUNCEMENT]: t('ptoj.announcement'),
  [DiscussionType.PRIVATE_CLARIFICATION]: t('ptoj.clarification'),
  [DiscussionType.ARCHIVED_DISCUSSION]: t('ptoj.archived'),
} as Record<DiscussionType, string>))

const discussionTypeSeverities = {
  [DiscussionType.OPEN_DISCUSSION]: 'success',
  [DiscussionType.PUBLIC_ANNOUNCEMENT]: 'primary',
  [DiscussionType.PRIVATE_CLARIFICATION]: 'info',
  [DiscussionType.ARCHIVED_DISCUSSION]: 'warn',
} as Record<DiscussionType, string>

const discussionTypeIcons = {
  [DiscussionType.OPEN_DISCUSSION]: 'pi pi-comments',
  [DiscussionType.PUBLIC_ANNOUNCEMENT]: 'pi pi-megaphone',
  [DiscussionType.PRIVATE_CLARIFICATION]: 'pi pi-info-circle',
  [DiscussionType.ARCHIVED_DISCUSSION]: 'pi pi-lock',
} as Record<DiscussionType, string>
</script>

<template>
  <Tag
    :icon="discussionTypeIcons[props.type]"
    :value="discussionTypeLabels[props.type]"
    :severity="discussionTypeSeverities[props.type]"
  />
</template>
