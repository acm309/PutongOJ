<script setup lang="ts">
import { tagColors } from '@backend/utils/constants'
import { storeToRefs } from 'pinia'
import { Button, Form, FormItem, Icon, Input, Message, Modal, Option, Select, Spin, Tag } from 'view-ui-plus'
import { capitalize, onBeforeMount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTagStore } from '@/store/modules/tag'
import { timePretty } from '@/utils/format'

const { t } = useI18n()
const tagStore = useTagStore()
const { tag, tags, tagsGroupByColor } = storeToRefs(tagStore)

const loadingTag = ref(false)
const loadingTags = ref(false)
const tagModal = ref(false)
const isCreate = ref(false)
const tagFormRef = ref<any>(null)

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

const tagRules = $computed(() => ({
  name: [
    { required: true, trigger: 'change' },
    { max: 30, trigger: 'change' },
  ],
  color: [
    { required: true, trigger: 'change' },
  ],
}))

async function doCreateTag () {
  await tagStore.createTag()
  Message.success('Tag created!')
  tagModal.value = false
  await fetch()
}

function createTag () {
  tag.value.name = tag.value.name.trim()
  tagFormRef.value.validate((valid: boolean) => {
    if (!valid) {
      Message.error(t('oj.form_invalid'))
      return
    }
    const exists = tags.value.find(item => item.name === tag.value.name)
    if (exists) {
      Modal.confirm({
        title: 'Duplicate Tag Name',
        content: `Tag with name "${tag.value.name}" already exists. Do you want to create it anyway?`,
        okText: 'Create',
        cancelText: 'Cancel',
        onOk: doCreateTag,
      })
    } else {
      doCreateTag()
    }
  })
}

function saveTag () {
  tag.value.name = tag.value.name.trim()
  tagFormRef.value.validate(async (valid: boolean) => {
    if (!valid) {
      Message.error(t('oj.form_invalid'))
      return
    }
    await tagStore.updateTag()
    tagModal.value = false
    Message.success('Tag updated!')
    await fetch()
  })
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
        <Button type="primary" icon="md-add" @click="openTagCreate">
          Create Tag
        </Button>
      </div>
    </div>
    <div v-if="tags.length === 0" class="tags-empty">
      <Icon type="ios-planet-outline" class="empty-icon" />
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
        <div class="tags-group-items">
          <Tag
            v-for="tagItem in tagsGroupByColor[color]" :key="tagItem.tagId" class="tag-item" size="large"
            :color="color" @click="openTagDetail(tagItem.tagId)"
          >
            {{ tagItem.name }}
          </Tag>
        </div>
      </div>
    </template>
    <Modal
      v-model="tagModal"
      :title="isCreate ? 'Create Problem Tag' : (loadingTag ? 'Tag Detail' : `Tag: ${tag.name}`)" cancel-text="Close"
      :ok-text="isCreate ? 'Create' : 'Save'" @on-ok="() => isCreate ? createTag() : saveTag()"
    >
      <Form ref="tagFormRef" class="tags-form" :label-width="90" :model="tag" :rules="tagRules">
        <FormItem prop="name">
          <template #label>
            <span style="line-height: 20px;">{{ t('oj.name') }}</span>
          </template>
          <Input v-model="tag.name" size="large" :maxlength="30" show-word-limit placeholder="Enter tag name" />
        </FormItem>
        <FormItem label="Color" prop="color">
          <Select v-model="tag.color">
            <Option v-for="color in tagColors" :key="color" :value="color" :label="capitalize(color)">
              <span>{{ capitalize(color) }}</span>
              <Tag :color="color" style="float: right; margin-top: -1.5px">
                {{ capitalize(color) }}
              </Tag>
            </Option>
          </Select>
        </FormItem>
        <FormItem v-if="!isCreate" label="Created At">
          <Input v-model="tagCreatedAt" readonly />
        </FormItem>
        <FormItem v-if="!isCreate" label="Updated At">
          <Input v-model="tagUpdatedAt" readonly />
        </FormItem>
      </Form>
      <Spin size="large" fix :show="loadingTag" class="wrap-loading" />
    </Modal>
    <Spin size="large" fix :show="loadingTags" class="wrap-loading" />
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
  margin-bottom -24px

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
