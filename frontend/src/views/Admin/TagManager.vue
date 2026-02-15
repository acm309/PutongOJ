<script setup lang="ts">
import { tagColors } from '@backend/utils/constants'
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import IftaLabel from 'primevue/iftalabel'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import { useConfirm } from 'primevue/useconfirm'
import { capitalize, onBeforeMount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ProblemTag from '@/components/ProblemTag.vue'
import { useTagStore } from '@/store/modules/tag'
import { timePretty } from '@/utils/format'
import { useMessage } from '@/utils/message'

const { t } = useI18n()
const message = useMessage()
const confirm = useConfirm()
const tagStore = useTagStore()
const { tag, tags, tagsGroupByColor } = storeToRefs(tagStore)

const loadingTag = ref(false)
const loadingTags = ref(false)
const tagModal = ref(false)
const isCreate = ref(false)

const colorOptions = tagColors.map(color => ({
  label: capitalize(color),
  value: color,
}))

async function fetch () {
  loadingTags.value = true
  await tagStore.findTags()
  loadingTags.value = false
}

async function openTagDetail (tagId: number) {
  loadingTag.value = true
  isCreate.value = false
  tagModal.value = true
  await tagStore.findTag(tagId)
  loadingTag.value = false
}

function openTagCreate () {
  tag.value = {
    name: '',
    color: 'default',
  } as any
  isCreate.value = true
  tagModal.value = true
}

const tagCreatedAt = $computed(() => {
  if (!tag.value.createdAt) return ''
  return timePretty(tag.value.createdAt)
})
const tagUpdatedAt = $computed(() => {
  if (!tag.value.updatedAt) return ''
  return timePretty(tag.value.updatedAt)
})

function isFormValid () {
  const name = tag.value.name?.trim()
  if (!name || name.length > 30) return false
  if (!tag.value.color) return false
  return true
}

async function doCreateTag () {
  await tagStore.createTag()
  message.success('Tag created!')
  tagModal.value = false
  await fetch()
}

function createTag () {
  tag.value.name = tag.value.name.trim()
  if (!isFormValid()) {
    message.error(t('oj.form_invalid'))
    return
  }
  const exists = tags.value.find(item => item.name === tag.value.name)
  if (exists) {
    confirm.require({
      header: 'Duplicate Tag Name',
      message: `Tag with name "${tag.value.name}" already exists. Do you want to create it anyway?`,
      acceptProps: {
        label: 'Create',
      },
      rejectProps: {
        label: 'Cancel',
        severity: 'secondary',
        outlined: true,
      },
      accept: doCreateTag,
    })
  } else {
    doCreateTag()
  }
}

async function saveTag () {
  tag.value.name = tag.value.name.trim()
  if (!isFormValid()) {
    message.error(t('oj.form_invalid'))
    return
  }
  await tagStore.updateTag()
  tagModal.value = false
  message.success('Tag updated!')
  await fetch()
}

onBeforeMount(fetch)
</script>

<template>
  <div class="tags-wrap">
    <div class="tags-header">
      <span class="tags-header-title">
        Problem Tags
      </span>
      <div>
        <Button icon="pi pi-plus" label="Create Tag" @click="openTagCreate" />
      </div>
    </div>
    <div v-if="tags.length === 0" class="tags-empty">
      <i class="empty-icon pi pi-folder-open" />
      <span class="empty-text">{{ t('oj.empty_content') }}</span>
    </div>
    <template v-for="color in tagColors" v-else>
      <div v-if="tagsGroupByColor[color]?.length > 0" :key="color" class="tags-group">
        <div class="tags-group-header">
          <span class="tags-group-title">
            {{ capitalize(color) }}
          </span>
          <span class="tags-group-count">({{ tagsGroupByColor[color].length }})</span>
        </div>
        <div class="flex flex-wrap gap-2 tags-group-items">
          <ProblemTag
            v-for="tagItem in tagsGroupByColor[color]" :key="tagItem.tagId" class="tag-item" size="large"
            :name="tagItem.name"
            :color="color" @click="openTagDetail(tagItem.tagId)"
          />
        </div>
      </div>
    </template>
    <Dialog
      v-model:visible="tagModal"
      :header="isCreate ? 'Create Problem Tag' : (loadingTag ? 'Tag Detail' : `Tag: ${tag.name}`)"
      modal :style="{ width: '480px' }"
    >
      <div class="flex flex-col gap-4 tags-form">
        <IftaLabel>
          <InputText id="tagName" v-model="tag.name" fluid :maxlength="30" placeholder="Enter tag name" />
          <label for="tagName">{{ t('oj.name') }}</label>
        </IftaLabel>
        <IftaLabel>
          <Select id="tagColor" v-model="tag.color" :options="colorOptions" option-label="label" option-value="value" fluid>
            <template #option="{ option }">
              <span>{{ option.label }}</span>
              <ProblemTag :color="option.value" class="ml-auto" :name="option.label" />
            </template>
          </Select>
          <label for="tagColor">Color</label>
        </IftaLabel>
        <IftaLabel v-if="!isCreate">
          <InputText id="tagCreatedAt" :model-value="tagCreatedAt" fluid readonly />
          <label for="tagCreatedAt">Created At</label>
        </IftaLabel>
        <IftaLabel v-if="!isCreate">
          <InputText id="tagUpdatedAt" :model-value="tagUpdatedAt" fluid readonly />
          <label for="tagUpdatedAt">Updated At</label>
        </IftaLabel>
      </div>
      <template #footer>
        <Button :label="t('oj.cancel') || 'Close'" severity="secondary" outlined @click="tagModal = false" />
        <Button :label="isCreate ? 'Create' : 'Save'" @click="() => isCreate ? createTag() : saveTag()" />
      </template>
    </Dialog>
  </div>
</template>

<style lang="stylus" scoped>
.tags-wrap
  max-width 768px
  padding-bottom 20px

.tags-header
  margin-bottom 20px
  display flex
  justify-content space-between
  .tags-header-title
    font-size 20px
    line-height 32px

.tags-group
  margin-bottom 20px
  .tags-group-header
    margin-bottom 6px
  .tags-group-title
    font-size 16px
  .tags-group-count
    margin-left 8px
  .tags-group-items
    .tag-item
      cursor: pointer

.tags-form
  padding 12px

.tags-empty
  margin-bottom 20px
  padding 32px
  border 1px solid #dcdee2
  border-radius 4px
  display flex
  align-items center
  justify-content center
  .empty-icon
    font-size 32px
  .empty-text
    margin-left 32px

@media screen and (max-width: 1024px)
  .tags-wrap
    padding-bottom 0
  .tags-header
    padding-top 10px
</style>
