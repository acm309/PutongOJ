<script setup>
import { storeToRefs } from 'pinia'
import { inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import { useTestcaseStore } from '@/store/modules/testcase'
import { testcaseUrl } from '@/util/helper'

import { Button, Divider, Icon, Input, Poptip, Space, Tag, Upload } from 'view-ui-plus'

const { t } = useI18n()
const route = useRoute()
const message = inject('$Message')
const modal = inject('$Modal')

const testcaseStore = useTestcaseStore()

const { list } = $(storeToRefs(testcaseStore))

const test = $ref({
  pid: route.params.pid,
  in: '',
  out: '',
})

let loading = $ref(false)

async function fetch() {
  loading = true
  await testcaseStore.find(route.params)
  loading = false
}

// function search(item) {
//   return testcaseStore.findOne({
//     pid: route.params.pid,
//     uuid: item.uuid,
//     type: 'in',
//   })
// }

function del(item) {
  const sort_uuid = item.uuid.slice(0, 8)
  modal.confirm({
    title: t('oj.alert'),
    content: t('oj.testcase.delete_confirm', { uuid: sort_uuid }),
    onOk: async () => {
      const testcase = {
        pid: route.params.pid,
        uuid: item.uuid,
      }
      await testcaseStore.delete(testcase)
      message.success(t('oj.testcase.delete_success', { uuid: sort_uuid }))
    },
    onCancel: () => {
      message.info(t('oj.testcase.delete_cancel'))
    },
  })
}

async function create(testcase) {
  await testcaseStore.create(testcase)
  message.success(t('oj.testcase.create_success'))
  fetch()
  test.in = test.out = ''
  testcaseFile.in = testcaseFile.out = null
}

async function createCheck() {
  const testcase = { pid: test.pid, in: test.in, out: test.out }

  for (let key in testcaseFile) {
    if (testcaseFile[key]) {
      try {
        testcase[key] = await readFile(key)
      } catch (e) {
        return message.error(t('oj.testcase.error_read_file', { error: e.message }))
      }
    }
  }

  if (!testcase.in.trim() && !testcase.out.trim()) {
    message.error(t('oj.testcase.error_empty'))
  } else if (!testcase.in.trim() || !testcase.out.trim()) {
    modal.confirm({
      title: t('oj.alert'),
      content: t('oj.testcase.error_incomplete'),
      onOk: () => create(testcase),
      onCancel: () => message.info(t('oj.testcase.create_cancel')),
    })
  } else
    create(testcase)
}

const testcaseFile = $ref({ in: null, out: null })
const fileInput = $computed(() => {
  return {
    in: testcaseFile.in !== null,
    out: testcaseFile.out !== null,
  }
})

async function readFile(type) {
  const file = testcaseFile[type]
  const reader = new FileReader()
  return new Promise((resolve, reject) => {
    reader.onload = () => {
      const content = reader.result.replace(/\r\n/g, '\n')
      if (/^[\x00-\x7F]*$/.test(content)) {
        resolve(content)
      } else {
        reject(new Error(t('oj.testcase.error_encoding')))
      }
    }
    reader.onerror = reject
    reader.readAsText(file)
  })
}

function fileSelect(type, file) {
  testcaseFile[type] = file
  return false
}

function removeFile(type) {
  testcaseFile[type] = null
}

function filename(type) {
  let name = testcaseFile[type].name
  let ext = name.slice(name.lastIndexOf('.') + 1)
  return name.length > 10 ? name.slice(0, 10) + `...${ext}` : name
}

fetch()
</script>

<template>
  <div class="testcase">
    <table class="testcase-table">
      <thead>
        <tr>
          <th class="testcase-uuid">UUID</th>
          <th class="testcase-files">{{ t('oj.files') }}</th>
          <th class="testcase-action">{{ t('oj.action') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!(list.testcases?.length > 0)" class="testcase-empty">
          <td colspan="4">
            <Icon type="ios-planet-outline" class="empty-icon" />
            <span class="empty-text">{{ t('oj.empty_content') }}</span>
          </td>
        </tr>
        <tr v-for="item in list.testcases" :key="item.uuid">
          <td class="testcase-uuid">
            <Poptip trigger="hover" placement="right">
              <span><code>{{ item.uuid.slice(0, 8) }}</code></span>
              <template #content>
                <code>{{ item.uuid }}</code>
              </template>
            </Poptip>
          </td>
          <td class="testcase-files">
            <Space :size="4">
              <a :href="testcaseUrl(test.pid, item.uuid, 'in')" target="_blank">{{ t('oj.problem.input') }}</a>
              <Divider type="vertical" />
              <a :href="testcaseUrl(test.pid, item.uuid, 'out')" target="_blank">{{ t('oj.problem.output') }}</a>
            </Space>
          </td>
          <td class="testcase-action">
            <a @click="del(item)">{{ t('oj.delete') }}</a>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="testcase-create">
      <h1>{{ t('oj.testcase.create') }}</h1>
      <div class="testcase-flex">
        <span class="testcase-title">{{ t('oj.problem.input') }}</span>
        <Upload class="testcase-upload" action="" :before-upload="(file) => fileSelect('in', file)">
          <Button class="testcase-upload-button" icon="ios-cloud-upload-outline">
            {{ t('oj.testcase.from_file') }}
          </Button>
        </Upload>
      </div>
      <Input class="testcase-textarea" v-if="!fileInput.in" v-model="test.in" type="textarea"
        :autosize="{ minRows: 5, maxRows: 15 }" />
      <div v-else class="testcase-file">
        <Icon type="ios-document-outline" class="file-icon" />
        <span class="file-text">{{ t('oj.testcase.file_selected') }}</span>
        <Tag class="file-name" type="dot" closable @on-close="removeFile('in')">{{ filename('in') }}</Tag>
      </div>
      <div class="testcase-flex">
        <span class="testcase-title">{{ t('oj.problem.output') }}</span>
        <Upload class="testcase-upload" action="" :before-upload="(file) => fileSelect('out', file)">
          <Button class="testcase-upload-button" icon="ios-cloud-upload-outline">
            {{ t('oj.testcase.from_file') }}
          </Button>
        </Upload>
      </div>
      <Input class="testcase-textarea" v-if="!fileInput.out" v-model="test.out" type="textarea"
        :autosize="{ minRows: 5, maxRows: 15 }" />
      <div v-else class="testcase-file">
        <Icon type="ios-document-outline" class="file-icon" />
        <span class="file-text">{{ t('oj.testcase.file_selected') }}</span>
        <Tag class="file-name" type="dot" closable @on-close="removeFile('out')">{{ filename('out') }}</Tag>
      </div>
      <Button class="testcase-submit" size="large" type="primary" @click="createCheck">
        {{ t('oj.submit') }}
      </Button>
    </div>
    <Spin size="large" fix :show="loading" class="wrap-loading" />
  </div>
</template>

<style lang="stylus" scoped>
@import '../../styles/common'

.testcase
  padding 0
  margin-top -20px

.testcase-table
  table-layout fixed
  th, td
    padding 0 16px
  tbody tr
    transition background-color 0.2s ease
    &:hover
      background-color #f7f7f7

.testcase-uuid
  padding-left 40px !important 
  text-align left
.testcase-action
  padding-right 40px !important
  text-align right

.testcase-empty
  &:hover
    background-color transparent !important
  td
    margin-bottom 20px
    padding 32px !important
    border-radius 4px
    text-align center
    .empty-icon
      display block
      font-size 32px

.testcase-create
  padding 30px 40px 40px

.testcase-flex
  margin-top 10px
  padding 4px 0
  width 100%
  display flex
  justify-content space-between
  align-items: center
  .testcase-title, .testcase-upload
    flex none
    display flex
  .testcase-title
    font-size 16px
    font-weight bold

.testcase-textarea
  font-family var(--font-code)

.testcase-file
  padding 32px
  border 1px solid #dcdee2
  border-radius 4px
  display flex
  align-items center
  justify-content center
  flex-wrap wrap
  .file-icon
    font-size 32px
  .file-text
    margin 0 16px
  .file-name
    font-family var(--font-code)

.testcase-submit
  margin-top 20px

@media screen and (max-width: 1024px)
  .testcase
    margin-top -10px
  .testcase-create
    padding 15px 20px 20px
</style>
